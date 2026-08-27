export interface Book {
  id: number;
  name: string;
  author: string;
  publisher: string;
  release_date: string;
  description: string;
  isbn: string;
  genre: string;
  cover: string;
  pages: number | null;
  pages_read: number | null;
}
