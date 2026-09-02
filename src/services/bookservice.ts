import api from "./api";
import type { Book } from "@/types/book";
import type { ApiResponse } from "@/types/api";

class BookService {
  async getAll(params: Record<string, unknown> = {}) {
    const response = await api.get<ApiResponse<Book[]>>("/books", { params });
    return response.data;
  }

  async getOne(id: number) {
    const response = await api.get<{ data: Book }>(`/books/${id}`);
    return response.data.data;
  }

  async getContinue() {
    const response = await api.get<ApiResponse<Book[]>>("/books/continue");
    return response.data.data;
  }

  async getGenres() {
    const response = await api.get<ApiResponse<string[]>>("/books/genres");
    return response.data.data;
  }

  async getStats() {
    const response = await api.get<{ data: import("@/types/book").ReadingStats; message: string }>("/books/stats");
    return response.data.data;
  }

  async create(data: FormData) {
    const response = await api.post("/books", data);
    return response.data.data as Book;
  }

  async uploadPdf(data: FormData, onProgress?: (pct: number) => void) {
    const response = await api.post("/books/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return response.data.data as Book;
  }

  async update(id: number, data: FormData) {
    data.append("_method", "PUT");
    try {
      const response = await api.post(`/books/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data as Book;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error("Book update request failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      throw error;
    }
  }

  async delete(id: number) {
    await api.delete(`/books/${id}`);
  }

  async search(query: string, params: Record<string, unknown> = {}) {
    const response = await api.get<ApiResponse<Book[]>>("/books/search", {
      params: { q: query, ...params },
    });
    return response.data;
  }

  getFileUrl(id: number) {
    const base = (api.defaults.baseURL as string) || "";
    return `${base.replace(/\/$/, "")}/books/${id}/file`;
  }

  async getProgress(id: number) {
    const res = await api.get<{ data: { current_page: number; total_pages: number | null; progress_percent: number; last_read_at: string | null } }>(`/books/${id}/progress`);
    return res.data.data;
  }

  async saveProgress(id: number, currentPage: number) {
    const res = await api.put(`/books/${id}/progress`, { current_page: currentPage });
    return res.data.data;
  }
}

export default new BookService();
