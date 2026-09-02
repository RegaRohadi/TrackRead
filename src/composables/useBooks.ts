import { ref, reactive } from "vue";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { Book, ReadingStats, ExternalBookResult, BookSource } from "@/types/book";
import BookService from "@/services/bookservice";
import openLibraryService from "@/services/openLibraryService";

export function useBooks() {
  const books = ref<Book[]>([]);
  const genres = ref<string[]>([]);
  const selectedGenre = ref("");
  const selectedStatus = ref<string>("");
  const selectedSource = ref<"" | BookSource>("");
  const stats = ref<ReadingStats | null>(null);
  const yearlyGoal = ref<number>(Number(localStorage.getItem("trackread_yearly_goal") || "12"));

  const page = ref(1);
  const perPage = ref(9);
  const total = ref(0);
  const lastPage = ref(1);
  const loading = ref(false);
  const isSubmitting = ref(false);
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const continueBooks = ref<Book[]>([]);
  const continueLoading = ref(false);

  const showForm = ref(false);
  const isEdit = ref(false);

  const searchQuery = ref("");

  const form = reactive<Book>({
    id: 0,
    name: "",
    author: "",
    publisher: "",
    release_date: "",
    description: "",
    genre: "",
    cover: "",
    cover_url: null,
    pages: null,
    pages_read: null,
    status: "to_read",
    source: "upload",
    pdf_path: null,
    pdf_original_name: null,
    pdf_size_bytes: null,
    pdf_total_pages: null,
    has_pdf: false,
  } as Book);

  const setYearlyGoal = (newGoal: number) => {
    yearlyGoal.value = Math.max(1, newGoal);
    localStorage.setItem("trackread_yearly_goal", String(yearlyGoal.value));
    showSuccess(`Target membaca tahunan diperbarui: ${yearlyGoal.value} buku`);
  };

  const coverPreviewUrl = ref<string | null>(null);
  const isFetchingCover = ref(false);
  const pendingCoverUrl = ref<string | null>(null);

  const resetForm = () => {
    Object.assign(form, {
      id: 0,
      name: "",
      author: "",
      publisher: "",
      release_date: "",
      description: "",
      genre: "",
      cover: "",
      cover_url: null,
      pages: null,
      pages_read: null,
      status: "to_read",
      source: "upload",
      pdf_path: null,
      pdf_original_name: null,
      pdf_size_bytes: null,
      pdf_total_pages: null,
      has_pdf: false,
    });
    coverFile.value = null;
    coverPreviewUrl.value = null;
    pendingCoverUrl.value = null;
    isFetchingCover.value = false;
    isEdit.value = false;
  };

  const showSuccess = (message: string) => {
    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: message,
      toast: true,
      position: "top-end",
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const showError = (message: string) => {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: message,
      toast: true,
      position: "top-end",
      timer: 3500,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const openCreateForm = () => {
    resetForm();
    showForm.value = true;
  };

  const openEditForm = (book: Book) => {
    Object.assign(form, book);
    if (!form.status) form.status = "to_read";
    isEdit.value = true;
    showForm.value = true;
  };

  const closeForm = () => {
    showForm.value = false;
    resetForm();
  };

  const getStats = async () => {
    try {
      stats.value = await BookService.getStats();
    } catch (error) {
      console.error("Failed to load reading stats", error);
    }
  };

  const getBooks = async (pageNumber = page.value) => {
    loading.value = true;
    page.value = pageNumber;
    try {
      const params: Record<string, unknown> = {
        page: page.value,
        per_page: perPage.value,
      };
      if (selectedGenre.value) params.genre = selectedGenre.value;
      if (selectedStatus.value) params.status = selectedStatus.value;
      if (selectedSource.value) params.source = selectedSource.value;
      const response = searchQuery.value.trim()
        ? await BookService.search(searchQuery.value, params)
        : await BookService.getAll(params);
      books.value = response.data;
      total.value = Number(response.meta?.total ?? books.value.length);
      lastPage.value = Number(response.meta?.last_page ?? 1);
    } catch (error: unknown) {
      console.error(error);
      showError("Gagal memuat daftar buku.");
    } finally {
      loading.value = false;
    }
  };

  const getContinueReading = async () => {
    continueLoading.value = true;
    try {
      continueBooks.value = await BookService.getContinue();
    } catch {
      continueBooks.value = [];
    } finally {
      continueLoading.value = false;
    }
  };

  const getGenres = async () => {
    try {
      genres.value = await BookService.getGenres();
    } catch (error: unknown) {
      console.error("Failed to load genres", error);
      showError("Gagal memuat daftar genre.");
    }
  };

  const coverFile = ref<File | null>(null);

  const setCover = (file: File | null) => {
    coverFile.value = file;
    if (file) {
      if (coverPreviewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl.value);
      coverPreviewUrl.value = URL.createObjectURL(file);
    } else {
      if (coverPreviewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl.value);
      coverPreviewUrl.value = null;
    }
  };

  function normalizeDateForInput(raw?: string | null): string {
    if (!raw) return "";
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
    if (/^\d{4}$/.test(s)) return `${s}-01-01`;
    return s.slice(0, 10);
  }

  const autofillFromExternal = async (externalBook: ExternalBookResult & { _olid?: string }) => {
    form.name = externalBook.title || form.name;
    form.author = externalBook.authors?.length ? externalBook.authors.join(", ") : form.author;
    form.publisher = externalBook.publisher || "";
    form.release_date = normalizeDateForInput(externalBook.publishedDate);
    let desc = externalBook.description || "";
    if (!desc && (externalBook as unknown as { _olid?: string })._olid) {
      try {
        desc = await openLibraryService.enrichOpenLibraryDescription(externalBook as unknown as Parameters<typeof openLibraryService.enrichOpenLibraryDescription>[0]);
      } catch {}
    }
    form.description = desc || "";
    form.genre = externalBook.categories?.[0] || "";
    form.pages = externalBook.pageCount ?? null;
    if (externalBook.thumbnail) {
      coverPreviewUrl.value = externalBook.thumbnail;
      pendingCoverUrl.value = externalBook.thumbnail;
      isFetchingCover.value = true;
      try {
        const file = await openLibraryService.fetchCoverAsFile(externalBook.thumbnail);
        if (pendingCoverUrl.value === externalBook.thumbnail && file) {
          coverFile.value = file;
          if (coverPreviewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl.value);
          coverPreviewUrl.value = URL.createObjectURL(file);
        }
      } catch (e) {
        console.warn("Cover auto-download failed", e);
      } finally {
        if (pendingCoverUrl.value === externalBook.thumbnail) isFetchingCover.value = false;
      }
    } else {
      coverFile.value = null;
      coverPreviewUrl.value = null;
      pendingCoverUrl.value = null;
      isFetchingCover.value = false;
    }
    showSuccess(`Data buku "${externalBook.title}" berhasil diisi otomatis!`);
  };

  const backgroundRefresh = async () => {
    try {
      await Promise.all([getBooks(page.value), getStats(), getContinueReading()]);
    } catch (e) {
      console.error("Background refresh failed", e);
    }
  };

  const applyStatsAdd = (book: Book) => {
    if (!stats.value) return;
    stats.value.total_books += 1;
    const status = book.status || "to_read";
    stats.value.status_breakdown[status] = (stats.value.status_breakdown[status] ?? 0) + 1;
    stats.value.total_pages += book.pdf_total_pages ?? book.pages ?? 0;
  };

  const applyStatsReplace = (oldBook: Book, newBook: Book) => {
    if (!stats.value) return;
    const oldStatus = oldBook.status || "to_read";
    const newStatus = newBook.status || "to_read";
    stats.value.status_breakdown[oldStatus] = Math.max(0, (stats.value.status_breakdown[oldStatus] ?? 0) - 1);
    stats.value.status_breakdown[newStatus] = (stats.value.status_breakdown[newStatus] ?? 0) + 1;
    stats.value.total_pages += (newBook.pdf_total_pages ?? newBook.pages ?? 0) - (oldBook.pdf_total_pages ?? oldBook.pages ?? 0);
  };

  const applyStatsDelete = (book: Book) => {
    if (!stats.value) return;
    stats.value.total_books = Math.max(0, stats.value.total_books - 1);
    const status = book.status || "to_read";
    stats.value.status_breakdown[status] = Math.max(0, (stats.value.status_breakdown[status] ?? 0) - 1);
    stats.value.total_pages = Math.max(0, stats.value.total_pages - (book.pdf_total_pages ?? book.pages ?? 0));
  };

  const createBook = async () => {
    isSubmitting.value = true;
    if (!coverFile.value && pendingCoverUrl.value && !isFetchingCover.value) {
      try {
        isFetchingCover.value = true;
        const file = await openLibraryService.fetchCoverAsFile(pendingCoverUrl.value);
        if (file) coverFile.value = file;
      } catch {}
      isFetchingCover.value = false;
    }
    if (isFetchingCover.value) {
      const start = Date.now();
      while (isFetchingCover.value && Date.now() - start < 5000) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      if (form.author) formData.append("author", form.author);
      if (form.publisher) formData.append("publisher", form.publisher);
      if (form.release_date) formData.append("release_date", form.release_date);
      if (form.description) formData.append("description", form.description);
      if (form.genre) formData.append("genre", form.genre);
      if (form.status) formData.append("status", form.status);
      if (form.pages !== null && form.pages !== undefined) formData.append("pages", String(form.pages));
      if (form.pages_read !== null && form.pages_read !== undefined) formData.append("pages_read", String(form.pages_read));
      if (coverFile.value) formData.append("cover", coverFile.value);
      const created = await BookService.create(formData);
      if (created && created.id) {
        books.value = [created, ...books.value];
        applyStatsAdd(created);
      }
      closeForm();
      showSuccess("Buku berhasil ditambahkan.");
      backgroundRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message ?? "Gagal menambahkan buku.");
    } finally {
      isSubmitting.value = false;
    }
  };

  const uploadPdf = async (file: File, meta: { name?: string; author?: string; genre?: string; description?: string }) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("File harus berformat PDF.");
      return null;
    }
    if (file.size > 50 * 1024 * 1024) {
      showError("Ukuran PDF melebihi 50MB.");
      return null;
    }
    isUploading.value = true;
    uploadProgress.value = 0;
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      fd.append("name", meta.name || file.name.replace(/\.pdf$/i, ""));
      if (meta.author) fd.append("author", meta.author);
      if (meta.genre) fd.append("genre", meta.genre);
      if (meta.description) fd.append("description", meta.description);
      const created = await BookService.uploadPdf(fd, (pct) => (uploadProgress.value = pct));
      books.value = [created, ...books.value];
      applyStatsAdd(created);
      showSuccess("PDF berhasil diupload.");
      backgroundRefresh();
      return created;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message ?? "Gagal upload PDF.");
      return null;
    } finally {
      isUploading.value = false;
    }
  };

  const updateBook = async () => {
    isSubmitting.value = true;
    try {
      const formData = new FormData();
      formData.append("name", form.name || "");
      formData.append("author", form.author || "");
      formData.append("publisher", form.publisher || "");
      formData.append("release_date", form.release_date || "");
      formData.append("description", form.description || "");
      formData.append("genre", form.genre || "");
      formData.append("status", form.status || "to_read");
      if (form.pages !== null && form.pages !== undefined) formData.append("pages", String(form.pages));
      if (form.pages_read !== null && form.pages_read !== undefined) formData.append("pages_read", String(form.pages_read));
      if (coverFile.value) formData.append("cover", coverFile.value);
      const updated = await BookService.update(form.id, formData);
      const prev = books.value.find((b) => b.id === form.id);
      if (updated && updated.id) {
        books.value = books.value.map((b) => (b.id === updated.id ? updated : b));
        if (prev) applyStatsReplace(prev, updated);
      }
      closeForm();
      showSuccess("Buku berhasil diperbarui.");
      backgroundRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message ?? "Gagal memperbarui buku.");
    } finally {
      isSubmitting.value = false;
    }
  };

  const deleteBook = async (id: number) => {
    const confirmResult = await Swal.fire({
      title: "Hapus Buku?",
      text: "Data buku yang dihapus tidak dapat dipulihkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      const deleted = books.value.find((b) => b.id === id);
      await BookService.delete(id);
      if (deleted) {
        books.value = books.value.filter((b) => b.id !== id);
        applyStatsDelete(deleted);
        continueBooks.value = continueBooks.value.filter((b) => b.id !== id);
      }
      showSuccess("Buku berhasil dihapus.");
      backgroundRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message ?? "Gagal menghapus buku.");
    }
  };

  const submitForm = async () => {
    if (isEdit.value) await updateBook();
    else await createBook();
  };

  const setPage = async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > lastPage.value) return;
    await getBooks(pageNumber);
  };

  const setGenre = async (genre: string) => {
    selectedGenre.value = genre;
    await getBooks(1);
  };

  const setStatus = async (status: string) => {
    selectedStatus.value = status;
    await getBooks(1);
  };

  const setSource = async (source: "" | BookSource) => {
    selectedSource.value = source;
    await getBooks(1);
  };

  const setSearch = async (query: string) => {
    searchQuery.value = query;
    await getBooks(1);
  };

  const clearSearch = async () => {
    searchQuery.value = "";
    await getBooks(1);
  };

  return {
    books,
    genres,
    selectedGenre,
    selectedStatus,
    selectedSource,
    stats,
    yearlyGoal,
    searchQuery,
    page,
    perPage,
    total,
    lastPage,
    form,
    loading,
    isSubmitting,
    isFetchingCover,
    isUploading,
    uploadProgress,
    continueBooks,
    continueLoading,
    showForm,
    isEdit,
    getBooks,
    getGenres,
    getStats,
    getContinueReading,
    setPage,
    setGenre,
    setStatus,
    setSource,
    setSearch,
    clearSearch,
    setYearlyGoal,
    submitForm,
    deleteBook,
    autofillFromExternal,
    uploadPdf,
    openCreateForm,
    openEditForm,
    closeForm,
    resetForm,
    setCover,
    coverFile,
    coverPreviewUrl,
    pendingCoverUrl,
  };
}
