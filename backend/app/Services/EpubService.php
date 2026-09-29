<?php

namespace App\Services;

class EpubService
{
    public const MIME = 'application/epub+zip';

    private const CHARS_PER_PAGE = 1600;

    private const COVER_MIME_EXT = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/svg+xml' => 'svg',
    ];

    public function isEpub(string $path): bool
    {
        if (!class_exists(\ZipArchive::class)) {
            return false;
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return false;
        }

        $mimetype = trim((string) $zip->getFromName('mimetype'));
        $hasContainer = $zip->locateName('META-INF/container.xml') !== false;
        $zip->close();

        return $hasContainer && ($mimetype === '' || $mimetype === self::MIME);
    }

    /**
     * @return array{title:?string,author:?string,publisher:?string,description:?string,pages:int,cover:?array{contents:string,mime:string,ext:string}}|null
     */
    public function parse(string $path): ?array
    {
        if (!class_exists(\ZipArchive::class)) {
            return null;
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return null;
        }

        try {
            $containerXml = $zip->getFromName('META-INF/container.xml');
            if ($containerXml === false) {
                return null;
            }

            $container = $this->loadXml($containerXml);
            if (!$container) {
                return null;
            }

            $rootfiles = $container->xpath('//*[local-name()="rootfile"]');
            $opfPath = $rootfiles ? (string) $rootfiles[0]['full-path'] : '';
            if ($opfPath === '') {
                return null;
            }

            $opfXml = $zip->getFromName($opfPath);
            if ($opfXml === false) {
                return null;
            }

            $opf = $this->loadXml($opfXml);
            if (!$opf) {
                return null;
            }

            $base = trim(str_replace('\\', '/', dirname($opfPath)), './');

            $firstText = function (string $localName) use ($opf): ?string {
                $nodes = $opf->xpath('//*[local-name()="' . $localName . '"]');
                if (!$nodes) {
                    return null;
                }
                $value = trim((string) $nodes[0]);
                return $value === '' ? null : $value;
            };

            $manifest = [];
            foreach ($opf->xpath('//*[local-name()="manifest"]/*[local-name()="item"]') ?: [] as $item) {
                $id = (string) $item['id'];
                if ($id === '') {
                    continue;
                }
                $manifest[$id] = [
                    'href' => (string) $item['href'],
                    'media-type' => strtolower((string) $item['media-type']),
                    'properties' => strtolower((string) $item['properties']),
                ];
            }

            $spineIds = [];
            foreach ($opf->xpath('//*[local-name()="spine"]/*[local-name()="itemref"]') ?: [] as $itemref) {
                $idref = (string) $itemref['idref'];
                if ($idref !== '') {
                    $spineIds[] = $idref;
                }
            }

            $chars = 0;
            foreach ($spineIds as $idref) {
                $href = $manifest[$idref]['href'] ?? null;
                if (!$href) {
                    continue;
                }
                $html = $zip->getFromName($this->resolve($base, $href));
                if ($html === false) {
                    continue;
                }
                $chars += $this->textLength($html);
            }

            return [
                'title' => $firstText('title'),
                'author' => $firstText('creator'),
                'publisher' => $firstText('publisher'),
                'description' => $firstText('description'),
                'pages' => max(1, (int) ceil($chars / self::CHARS_PER_PAGE)),
                'cover' => $this->extractCover($zip, $opf, $manifest, $base),
            ];
        } finally {
            $zip->close();
        }
    }

    private function extractCover(\ZipArchive $zip, \SimpleXMLElement $opf, array $manifest, string $base): ?array
    {
        $coverId = null;
        foreach ($opf->xpath('//*[local-name()="metadata"]/*[local-name()="meta"]') ?: [] as $meta) {
            if (in_array(strtolower((string) $meta['name']), ['cover', 'cover-image'], true)) {
                $coverId = (string) $meta['content'];
                break;
            }
        }

        $cover = $coverId && isset($manifest[$coverId]) ? $manifest[$coverId] : null;

        if (!$cover) {
            foreach ($manifest as $item) {
                if (str_contains($item['properties'], 'cover-image')) {
                    $cover = $item;
                    break;
                }
            }
        }

        if (!$cover) {
            foreach ($manifest as $id => $item) {
                if (str_starts_with($item['media-type'], 'image/') && str_contains($id . ' ' . $item['href'], 'cover')) {
                    $cover = $item;
                    break;
                }
            }
        }

        if (!$cover) {
            return null;
        }

        $contents = $zip->getFromName($this->resolve($base, $cover['href']));
        if ($contents === false || $contents === '') {
            return null;
        }

        $mime = $cover['media-type'];
        if (!isset(self::COVER_MIME_EXT[$mime])) {
            $path = parse_url($cover['href'], PHP_URL_PATH) ?: '';
            $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $mime = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
            ][$extension] ?? '';
        }

        if (!isset(self::COVER_MIME_EXT[$mime])) {
            return null;
        }

        return [
            'contents' => $contents,
            'mime' => $mime,
            'ext' => self::COVER_MIME_EXT[$mime],
        ];
    }

    private function resolve(string $base, string $href): string
    {
        $path = parse_url($href, PHP_URL_PATH);
        $href = ltrim(rawurldecode($path === null || $path === false ? $href : $path), '/');

        return $base === '' ? $href : $base . '/' . $href;
    }

    private function textLength(string $html): int
    {
        $html = preg_replace('/<(script|style)\b[^>]*>.*?<\/\1>/is', ' ', $html) ?? $html;
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return mb_strlen(trim($text));
    }

    private function loadXml(string $xml): ?\SimpleXMLElement
    {
        $previous = libxml_use_internal_errors(true);
        $element = simplexml_load_string($xml);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        return $element === false ? null : $element;
    }
}
