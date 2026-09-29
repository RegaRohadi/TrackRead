import type { ExternalBookResult } from '@/types/book';
import api from './api';

/**
 * Service for external book data lookup using Google Books & Open Library APIs
 * - Parallel merge for max results (8+8), no API key (anonymous)
 * - Overwrite mode: caller overwrites all fields
 * - Cover auto-download via fetchCoverAsFile
 */

function normalizePublishedDate(raw?: string): string {
  if (!raw) return '';
  const s = raw.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  // Google sometimes returns YYYY-MM-DD with extra? slice
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

function dedupeResults(results: ExternalBookResult[]): ExternalBookResult[] {
  const seen = new Set<string>();
  const out: ExternalBookResult[] = [];
  for (const r of results) {
    const key = r.isbn
      ? `isbn:${r.isbn.replace(/[-\s]/g, '')}`
      : `title:${r.title.toLowerCase().trim()}|${(r.authors[0] || '').toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export const openLibraryService = {
  async searchGoogleBooks(query: string): Promise<ExternalBookResult[]> {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query.trim())}&maxResults=8`
    );
    if (!response.ok) throw new Error('Google Books search failed');
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    return data.items.map((item: any) => {
      const info = item.volumeInfo || {};
      const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
      const isbn10 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;
      let thumb = info.imageLinks?.thumbnail?.replace('http:', 'https:') || info.imageLinks?.smallThumbnail?.replace('http:', 'https:') || '';
      if (thumb) {
        // Open Library legacy covers return 403 without edge=curl; Google needs it; keep as-is
        thumb = thumb.replace('http://', 'https://');
      }
      return {
        title: info.title || 'Tanpa Judul',
        authors: info.authors || ['Anonim'],
        publisher: info.publisher || '',
        publishedDate: normalizePublishedDate(info.publishedDate || ''),
        description: info.description || '',
        isbn: isbn13 || isbn10 || '',
        pageCount: info.pageCount || null,
        categories: info.categories || [],
        thumbnail: thumb,
        source: 'google' as const,
      };
    });
  },

  async searchOpenLibrary(query: string): Promise<ExternalBookResult[]> {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=8`
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.docs) return [];
    return data.docs.map((doc: any) => {
      const isbn = doc.isbn?.[0] || '';
      const coverId = doc.cover_i;
      const thumbnail = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';
      return {
        title: doc.title || 'Tanpa Judul',
        authors: doc.author_name || ['Anonim'],
        publisher: doc.publisher?.[0] || '',
        publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : normalizePublishedDate(doc.publish_date?.[0] || ''),
        description: '',
        isbn,
        pageCount: doc.number_of_pages_median || null,
        categories: doc.subject?.slice(0, 3) || [],
        thumbnail,
        source: 'openlibrary' as const,
        // keep raw key for enrichment if needed
        _olid: doc.key || '',
      } as ExternalBookResult & { _olid?: string };
    });
  },

  /**
   * Parallel merge Google + Open Library for max results
   */
  async searchBooks(query: string): Promise<ExternalBookResult[]> {
    if (!query.trim()) return [];
    const [googleRes, olRes] = await Promise.allSettled([
      this.searchGoogleBooks(query),
      this.searchOpenLibrary(query),
    ]);
    const google = googleRes.status === 'fulfilled' ? googleRes.value : [];
    const ol = olRes.status === 'fulfilled' ? olRes.value : [];
    if (google.length === 0 && ol.length === 0) return [];
    // Google first, then OL, deduped
    const merged = [...google, ...ol];
    return dedupeResults(merged);
  },

  /**
   * Try to enrich Open Library result with description from Works API
   */
  async enrichOpenLibraryDescription(book: ExternalBookResult & { _olid?: string }): Promise<string> {
    if (book.source !== 'openlibrary' || !book._olid) return book.description || '';
    try {
      const olid = book._olid.replace('/works/', '');
      const res = await fetch(`https://openlibrary.org/works/${olid}.json`);
      if (!res.ok) return book.description || '';
      const data = await res.json();
      const desc = data.description;
      if (!desc) return '';
      return typeof desc === 'string' ? desc : desc.value || '';
    } catch {
      return book.description || '';
    }
  },

  /**
   * Quick lookup by specific ISBN – tries both APIs
   */
  async lookupByISBN(isbn: string): Promise<ExternalBookResult | null> {
    const cleanIsbn = isbn.replace(/[-\s]/g, '').trim();
    if (!cleanIsbn) return null;
    // Try google isbn: query
    try {
      const google = await this.searchGoogleBooks(`isbn:${cleanIsbn}`);
      if (google[0]) return google[0];
    } catch {}
    // Try Open Library bibkeys API for richer data
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      if (res.ok) {
        const data = await res.json();
        const entry = data[`ISBN:${cleanIsbn}`];
        if (entry) {
          return {
            title: entry.title || 'Tanpa Judul',
            authors: entry.authors?.map((a: any) => a.name) || ['Anonim'],
            publisher: entry.publishers?.[0]?.name || '',
            publishedDate: normalizePublishedDate(entry.publish_date || ''),
            description: typeof entry.description === 'string' ? entry.description : entry.description?.value || '',
            isbn: cleanIsbn,
            pageCount: entry.number_of_pages || null,
            categories: entry.subjects?.slice(0, 3).map((s: any) => s.name) || [],
            thumbnail: entry.cover?.medium || entry.cover?.large || entry.cover?.small || '',
            source: 'openlibrary',
          };
        }
      }
    } catch {}
    // Fallback to merged search
    const results = await this.searchBooks(`isbn:${cleanIsbn}`);
    return results[0] ?? null;
  },

  /**
   * Download thumbnail as File for FormData upload (cover auto-fill)
   */
  async fetchCoverAsFile(thumbnailUrl: string): Promise<File | null> {
    if (!thumbnailUrl) return null;
    // 1) Try backend proxy (bypasses CORS) — now public, no auth needed
    try {
      const response = await api.get('/books/fetch-cover', {
        params: { url: thumbnailUrl },
        responseType: 'blob',
        timeout: 20000,
      });
      const blob = response.data as Blob;
      if (blob && blob.type.startsWith('image/')) {
        if (blob.size > 2 * 1024 * 1024) {
          console.warn('Cover exceeds 2MB, skipping auto-attach');
          return null;
        }
        const ext = blob.type.split('/')[1]?.split(';')[0] || 'jpg';
        const filename = `cover-${Date.now()}.${ext}`;
        return new File([blob], filename, { type: blob.type });
      }
      console.warn('Proxy returned non-image:', blob?.type);
    } catch (err: any) {
      console.warn('Proxy fetch failed, trying direct fetch:', err?.response?.status, err?.message);
    }
    // 2) Fallback: direct fetch (may succeed for some hosts with CORS)
    try {
      const resp = await fetch(thumbnailUrl, { mode: 'cors', referrerPolicy: 'no-referrer' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) return null;
      if (blob.size > 2 * 1024 * 1024) return null;
      const ext = blob.type.split('/')[1]?.split(';')[0] || 'jpg';
      return new File([blob], `cover-${Date.now()}.${ext}`, { type: blob.type });
    } catch (err) {
      console.warn('Direct fetch also failed, using URL preview only:', err);
      return null;
    }
  },
};

export default openLibraryService;
