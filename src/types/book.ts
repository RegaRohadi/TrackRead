export type ReadingStatus = 'to_read' | 'currently_reading' | 'finished' | 'dropped';

export type BookSource = 'platform' | 'upload';

export interface ReadingProgress {
  current_page: number;
  total_pages: number | null;
  progress_percent: number;
  last_read_at: string | null;
}

export interface Book {
  id: number;
  name: string;
  author: string | null;
  publisher: string | null;
  release_date: string | null;
  description: string | null;
  genre: string | null;
  cover: string | null;
  cover_url: string | null;
  pages: number | null;
  pages_read: number | null;
  status?: ReadingStatus;
  source: BookSource;
  pdf_path: string | null;
  pdf_original_name: string | null;
  pdf_size_bytes: number | null;
  pdf_total_pages: number | null;
  has_pdf: boolean;
  progress?: ReadingProgress | null;
  current_page?: number | null;
  progress_percent?: number;
  last_read_at?: string | null;
}

export interface ReadingStats {
  total_books: number;
  status_breakdown: {
    to_read: number;
    currently_reading: number;
    finished: number;
    dropped: number;
  };
  total_pages: number;
  total_pages_read: number;
  completion_percentage: number;
}

export interface ExternalBookResult {
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string[];
  thumbnail?: string;
  source: 'google' | 'openlibrary';
}
