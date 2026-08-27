import api from "./api";

import type { Book } from "@/types/book";
import type { ApiResponse } from "@/types/api";

class BookService {

  async getAll(params: Record<string, unknown> = {}) {
    const response = await api.get<ApiResponse<Book[]>>("/books", { params });
    return response.data;
  }

  async getGenres() {
    const response = await api.get<ApiResponse<string[]>>("/books/genres");
    return response.data.data;
  }

  async create(data: FormData) {
    const response = await api.post("/books", data);

    return response.data.data;
  }

  async update(id: number, data: FormData) {
    try {
      const response = await api.put(`/books/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Book update request failed", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
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
}

export default new BookService();
