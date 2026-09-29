<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'release_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'genre' => ['nullable', 'string', 'max:100'],
            'pages' => ['nullable', 'integer', 'min:1'],
            'cover' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048'
            ],
            'pages_read' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'in:to_read,currently_reading,finished,dropped'],
            'pdf' => ['nullable', 'file', 'max:51200', $this->bookFileRule()],
            'file' => ['nullable', 'file', 'max:51200', $this->bookFileRule()],
        ];
    }

    private function bookFileRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) {
            if (!$value instanceof \Illuminate\Http\UploadedFile) {
                return;
            }

            $extension = strtolower($value->getClientOriginalExtension());
            $mime = strtolower((string) $value->getMimeType());

            $allowed = [
                'pdf' => ['application/pdf'],
                'epub' => ['application/epub+zip', 'application/zip', 'application/octet-stream'],
            ];

            if (!isset($allowed[$extension])) {
                $fail('File harus berformat PDF atau EPUB.');
                return;
            }

            if ($mime !== '' && !in_array($mime, $allowed[$extension], true)) {
                $fail('Isi file tidak cocok dengan ekstensi .' . $extension . '.');
            }
        };
    }
}
