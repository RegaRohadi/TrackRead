import { ref, reactive } from "vue";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { Book } from "@/types/book";
import BookService from "@/services/bookservice";

export function useBooks() {
  const books = ref<Book[]>([]);
  const genres = ref<string[]>([]);
  const selectedGenre = ref("");
  const page = ref(1);
  const perPage = ref(8);
  const total = ref(0);
  const lastPage = ref(1);
  const loading = ref(false);
  const isSubmitting = ref(false);

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
    isbn: "",
    genre: "",
    cover: "",
    pages: null,
    pages_read: null,
  });

  const resetForm = () => {
    Object.assign(form, {
      id: 0,
      name: "",
      author: "",
      publisher: "",
      release_date: "",
      description: "",
      isbn: "",
      genre: "",
      pages: null,
      pages_read: null,
    });

    coverFile.value = null;
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

    isEdit.value = true;
    showForm.value = true;
  };

  const closeForm = () => {
    showForm.value = false;
    resetForm();
  };

  const getBooks = async (pageNumber = page.value) => {
    loading.value = true;
    page.value = pageNumber;

    try {
      const params: Record<string, unknown> = {
        page: page.value,
        per_page: perPage.value,
      };

      if (selectedGenre.value) {
        params.genre = selectedGenre.value;
      }

      const response = searchQuery.value.trim()
        ? await BookService.search(searchQuery.value, params)
        : await BookService.getAll(params);

      books.value = response.data;
      total.value = Number(response.meta?.total ?? books.value.length);
      lastPage.value = Number(response.meta?.last_page ?? 1);
    } catch (error: any) {
      console.error(error);
      showError("Gagal memuat daftar buku.");
    } finally {
      loading.value = false;
    }
  };

  const getGenres = async () => {
    try {
      genres.value = await BookService.getGenres();
    } catch (error: any) {
      console.error("Failed to load genres", error);
      showError("Gagal memuat daftar genre.");
    }
  };

  const coverFile = ref<File | null>(null);

  const setCover = (file: File | null) => {
    coverFile.value = file;
  };

  const createBook = async () => {
    isSubmitting.value = true;

    try {

      const formData = new FormData();

      formData.append("name", form.name);

      if (form.author)
        formData.append("author", form.author);

      if (form.publisher)
        formData.append("publisher", form.publisher);

      if (form.release_date)
        formData.append("release_date", form.release_date);

      if (form.description)
        formData.append("description", form.description);

      if (form.genre)
        formData.append("genre", form.genre);

      if (form.isbn)
        formData.append("isbn", form.isbn);

      if (form.pages !== null && form.pages !== undefined)
        formData.append("pages", String(form.pages));

      if (form.pages_read !== null && form.pages_read !== undefined)
        formData.append("pages_read", String(form.pages_read));

      if (coverFile.value) {
        formData.append("cover", coverFile.value);
      }

      await BookService.create(formData);

      await getBooks();

      closeForm();
      showSuccess("Buku berhasil ditambahkan.");

    } catch (error: any) {
      console.error("Create book failed", error);
      showError(error?.response?.data?.message ?? "Gagal menambahkan buku.");
    } finally {
      isSubmitting.value = false;
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
      formData.append("isbn", form.isbn || "");

      if (form.pages !== null && form.pages !== undefined) {
        formData.append("pages", String(form.pages));
      }

      if (form.pages_read !== null && form.pages_read !== undefined) {
        formData.append("pages_read", String(form.pages_read));
      }

      if (coverFile.value) {
        formData.append("cover", coverFile.value);
      }

      await BookService.update(form.id, formData);

      await getBooks();

      closeForm();
      showSuccess("Buku berhasil diperbarui.");
    } catch (error: any) {
      console.error("Update book failed", error);
      showError(error?.response?.data?.message ?? "Gagal memperbarui buku.");
    } finally {
      isSubmitting.value = false;
    }
  };

  const deleteBook = async (id: number) => {
    if (!confirm("Yakin ingin menghapus buku?")) return;

    try {
      await BookService.delete(id);
      await getBooks(page.value);
      showSuccess("Buku berhasil dihapus.");
    } catch (error: any) {
      console.error(error);
      showError(error?.response?.data?.message ?? "Gagal menghapus buku.");
    }
  };

  const submitForm = async () => {
    if (isEdit.value) {
      await updateBook();
    } else {
      await createBook();
    }
  };

  const setPage = async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > lastPage.value) return;
    await getBooks(pageNumber);
  };

  const setGenre = async (genre: string) => {
    selectedGenre.value = genre;
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
    searchQuery,
    page,
    perPage,
    total,
    lastPage,
    form,

    loading,
    isSubmitting,

    showForm,
    isEdit,

    getBooks,
    getGenres,
    setPage,
    setGenre,
    setSearch,
    clearSearch,
    submitForm,
    deleteBook,

    openCreateForm,
    openEditForm,
    closeForm,

    resetForm,
    setCover,
  };
}
