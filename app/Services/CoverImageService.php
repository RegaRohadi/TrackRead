<?php

namespace App\Services;

class CoverImageService
{
    public const MAX_WIDTH = 600;

    public const JPEG_QUALITY = 80;

    /**
     * Downscale a cover image to a web-friendly JPEG.
     *
     * SVG files, undecodable images, and small JPEGs are returned unchanged.
     *
     * @return array{contents: string, mime: string, ext: string}
     */
    public function normalize(string $contents, string $mime, string $ext): array
    {
        $original = ['contents' => $contents, 'mime' => $mime, 'ext' => $ext];

        if ($contents === '' || strtolower($mime) === 'image/svg+xml' || ! function_exists('imagecreatefromstring')) {
            return $original;
        }

        $source = @imagecreatefromstring($contents);
        if ($source === false) {
            return $original;
        }

        $width = imagesx($source);
        $height = imagesy($source);

        if ($width < 1 || $height < 1) {
            imagedestroy($source);

            return $original;
        }

        if ($width <= self::MAX_WIDTH && strtolower($mime) === 'image/jpeg' && strlen($contents) <= 150_000) {
            imagedestroy($source);

            return $original;
        }

        $targetWidth = min($width, self::MAX_WIDTH);
        $targetHeight = (int) max(1, round($height * ($targetWidth / $width)));

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $white);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        $encoded = imagejpeg($canvas, null, self::JPEG_QUALITY);
        $bytes = (string) ob_get_clean();

        imagedestroy($canvas);
        imagedestroy($source);

        if (! $encoded || $bytes === '') {
            return $original;
        }

        return ['contents' => $bytes, 'mime' => 'image/jpeg', 'ext' => 'jpg'];
    }
}
