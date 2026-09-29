<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\ReadingProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReadingProgressController extends Controller
{
    public function show(Request $request, int $id)
    {
        $book = Book::findOrFail($id);
        $uid = Auth::id();
        if ($book->source === Book::SOURCE_UPLOAD && (int) $book->user_id !== (int) $uid) {
            abort(403);
        }
        $progress = ReadingProgress::where('user_id', $uid)->where('book_id', $id)->first();
        $tp = $progress?->total_pages ?: ($book->pdf_total_pages ?: $book->pages);
        $cp = $progress?->current_page ?: 1;
        return response()->json([
            'data' => [
                'book_id' => $book->id,
                'current_page' => $cp,
                'total_pages' => $tp,
                'progress_percent' => $tp ? round(min(100, ($cp / $tp) * 100), 1) : 0,
                'last_read_at' => $progress?->last_read_at,
            ],
        ]);
    }

    public function update(Request $request, int $id)
    {
        $book = Book::findOrFail($id);
        $uid = Auth::id();
        if ($book->source === Book::SOURCE_UPLOAD && (int) $book->user_id !== (int) $uid) {
            abort(403);
        }
        $bookTotal = $book->pdf_total_pages ?: $book->pages;

        // Readers may report their own page count (e.g. EPUB locations),
        // which can differ from the stored estimate.
        $validated = $request->validate([
            'current_page' => ['required', 'integer', 'min:1', 'max:100000'],
            'total_pages' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ]);
        $current = (int) $validated['current_page'];
        $total = isset($validated['total_pages']) ? (int) $validated['total_pages'] : $bookTotal;
        $limit = max((int) ($bookTotal ?: 0), (int) ($total ?: 0), 10000);

        if ($current > $limit || ($total && $current > $total)) {
            return response()->json(['message' => 'Halaman melebihi total halaman.'], 422);
        }

        $percent = $total ? round(min(100, ($current / $total) * 100), 1) : 0;
        $existing = ReadingProgress::where('user_id', $uid)->where('book_id', $id)->first();

        // Keep the shelf status in sync with actual reading so the "Sedang
        // Dibaca" shelf and the library counts agree. A finished book is not
        // downgraded by revisiting earlier pages.
        if ($percent >= 100) {
            $status = Book::STATUS_FINISHED;
        } elseif ($existing?->status === Book::STATUS_FINISHED) {
            $status = Book::STATUS_FINISHED;
        } else {
            $status = Book::STATUS_CURRENTLY_READING;
        }

        $progress = ReadingProgress::updateOrCreate(
            ['user_id' => $uid, 'book_id' => $id],
            ['current_page' => $current, 'total_pages' => $total, 'status' => $status, 'last_read_at' => now()]
        );
        return response()->json([
            'data' => [
                'book_id' => $id,
                'current_page' => $progress->current_page,
                'total_pages' => $progress->total_pages,
                'progress_percent' => $percent,
                'status' => $progress->status,
                'last_read_at' => $progress->last_read_at,
            ],
            'message' => 'Progress saved',
        ]);
    }
}
