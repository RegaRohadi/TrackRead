<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EpubUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_epub_and_read_it_back(): void
    {
        Storage::fake('private');
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/books', [
            'name' => 'Buku EPUB',
            'file' => UploadedFile::fake()->createWithContent('contoh.epub', $this->epubBytes()),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.file_type', 'epub');
        $response->assertJsonPath('data.has_file', true);
        $this->assertDatabaseHas('books', [
            'user_id' => $user->id,
            'file_type' => 'epub',
            'pdf_mime' => 'application/epub+zip',
        ]);

        $bookId = $response->json('data.id');

        $book = Book::findOrFail($bookId);
        $this->assertNotNull($book->cover);
        $this->assertStringEndsWith('.jpg', $book->cover);
        Storage::disk('public')->assertExists($book->cover);

        $fileResponse = $this->actingAs($user, 'sanctum')->get("/api/v1/books/{$bookId}/file");
        $fileResponse->assertOk();
        $this->assertSame('application/epub+zip', $fileResponse->headers->get('Content-Type'));
    }

    public function test_upload_rejects_unsupported_file_type(): void
    {
        Storage::fake('private');
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->withHeaders(['Accept' => 'application/json'])
            ->post('/api/v1/books', [
                'name' => 'Buku TXT',
                'file' => UploadedFile::fake()->createWithContent('catatan.txt', 'hello world'),
            ])
            ->assertStatus(422);
    }

    private function epubBytes(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'epub');

        $zip = new \ZipArchive();
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('mimetype', 'application/epub+zip');
        $zip->addFromString('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
        $zip->addFromString('OEBPS/images/cover.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
        $zip->addFromString('OEBPS/content.opf', '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Buku Uji</dc:title><dc:creator>Penulis Uji</dc:creator></metadata><manifest><item id="cover-img" href="images/cover.png" media-type="image/png" properties="cover-image"/><item id="c1" href="chap1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>');
        $zip->addFromString('OEBPS/chap1.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>' . str_repeat('kata ', 800) . '</p></body></html>');
        $zip->close();

        $bytes = (string) file_get_contents($path);
        @unlink($path);

        return $bytes;
    }
}
