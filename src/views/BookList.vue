<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useBooks } from "@/composables/useBooks";
import { useAuthStore } from "@/stores/auth";

import ProgressBar from "@/components/ProgressBar.vue";

import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";

import BookCard from "@/components/BookCard.vue";
import BookForm from "@/components/BookForm.vue";
import SearchBar from "@/components/SearchBar.vue";
import type { Book } from "@/types/book";

import BookPlaceholder from "@/assets/placeholder.svg";
const storageBase = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';
const coverUrl = (cover?: string | null): string => {
  return cover
    ? `${storageBase}/${cover}`
    : BookPlaceholder;
};


const {
  books,
  genres,
  selectedGenre,
  searchQuery,
  page,
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
  setCover,
} = useBooks();

const router = useRouter();
const authStore = useAuthStore();

const featuredId = ref<number | null>(null);

const featuredBook = computed<Book | null>(
  () => books.value.find((b) => b.id === featuredId.value) ?? books.value[0] ?? null
);

const otherBooks = computed<Book[]>(() =>
  books.value.filter((b) => b.id !== featuredBook.value?.id)
);

function selectFeatured(book: Book) {
  featuredId.value = book.id;
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function handleLogout() {
  await authStore.logout();
  await router.push({ name: "auth" });
}

watch(books, (newBooks) => {
  if (!newBooks.some((b) => b.id === featuredId.value)) {
    featuredId.value = newBooks[0]?.id ?? null;
  }
});

const visiblePages = computed(() => {
  const maxVisible = 5;

  let start = Math.max(1, page.value - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > lastPage.value) {
    end = lastPage.value;
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from(
    { length: end - start + 1 },
    (_, i) => start + i
  );
});


onMounted(() => {
  getGenres();
  getBooks();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="mx-auto max-w-7xl p-4 sm:p-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between sm:mb-8">
        <div>
          <h1 class="text-2xl font-bold sm:text-3xl">Book Management</h1>
          <p class="text-sm text-gray-500 sm:text-base">Kelola daftar buku</p>
        </div>

        <div class="flex items-center gap-2">
          <BaseButton @click="openCreateForm"> Tambah Buku </BaseButton>
          <button
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            @click="handleLogout">
            Logout
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-16 text-center">Memuat data...</div>

      <!-- Empty -->
      <div v-else-if="books.length === 0" class="rounded-xl bg-white p-10 text-center shadow">
        Belum ada data buku.
      </div>

      <!-- Content: kiri vertikal (featured), kanan list BookCard -->
      <div v-else>

        <div
          class="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <!-- Filter -->

          <SearchBar placeholder="Cari judul, penulis, atau ISBN..." @search="setSearch" @clear="clearSearch" />

          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-gray-500">
              Genre
            </label>

            <select v-model="selectedGenre" @change="setGenre(selectedGenre)"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none">
              <option value="">Semua</option>

              <option v-for="genre in genres" :key="genre" :value="genre">
                {{ genre }}
              </option>
            </select>
          </div>

          <!-- Pagination -->
          <div v-if="lastPage > 1" class="flex items-center rounded-lg border border-gray-200 bg-white">
            <!-- First -->
            <button :disabled="page <= 1" @click="setPage(1)"
              class="px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40">
              «
            </button>

            <!-- Previous -->
            <button :disabled="page <= 1" @click="setPage(page - 1)"
              class="px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40">
              ‹
            </button>

            <!-- Page Numbers -->
            <button v-for="n in visiblePages" :key="n" @click="setPage(n)" class="h-10 w-10 text-sm transition" :class="n === page
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-50'
              ">
              {{ n }}
            </button>

            <!-- Next -->
            <button :disabled="page >= lastPage" @click="setPage(page + 1)"
              class="px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40">
              ›
            </button>

            <!-- Last -->
            <button :disabled="page >= lastPage" @click="setPage(lastPage)"
              class="px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40">
              »
            </button>
          </div>
        </div>


        <div class="grid grid-cols-[220px_1fr] items-start gap-3 sm:grid-cols-[280px_1fr] sm:gap-6">
          <!-- Featured Book (kiri, vertikal) -->
          <Transition mode="out-in" enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="featuredBook" :key="featuredBook.id"
              class="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
              <!-- Cover besar -->
              <div>
                <img :src="coverUrl(featuredBook.cover)" :alt="featuredBook.name"
                  class="h-56 w-full object-cover sm:h-72" />
              </div>

              <div class="flex flex-1 flex-col p-4 sm:p-5">
                <span
                  class="mb-2 inline-block w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 sm:text-xs">
                  {{ featuredBook.genre }}
                </span>

                <h2 class="text-base font-bold leading-snug text-gray-900 sm:text-xl">
                  {{ featuredBook.name }}
                </h2>
                <p class="mt-1 text-xs text-gray-500 sm:text-sm">
                  by {{ featuredBook.author }}
                </p>

                <ProgressBar v-if="(featuredBook?.pages ?? 0) > 0" :total="featuredBook?.pages ?? 0"
                  :value="featuredBook?.pages_read ?? 0" color="blue" class="mt-3" />

                <dl class="mt-4 space-y-2 text-xs text-gray-600 sm:text-sm">
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-400">Publisher</dt>
                    <dd class="truncate text-right font-medium">
                      {{ featuredBook.publisher }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-400">Rilis</dt>
                    <dd class="truncate text-right font-medium">
                      {{ formatDate(featuredBook.release_date) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-2">
                    <dt class="text-gray-400">ISBN</dt>
                    <dd class="truncate text-right font-mono font-medium">
                      {{ featuredBook.isbn }}
                    </dd>
                  </div>
                </dl>

                <div class="mt-4 flex gap-2 sm:mt-6">
                  <button
                    class="flex-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 sm:text-sm"
                    @click="openEditForm(featuredBook)">
                    Edit
                  </button>
                  <button
                    class="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 sm:text-sm"
                    @click="deleteBook(featuredBook.id)">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- List buku lain (kanan, BookCard, scrollable) -->
          <div v-if="otherBooks.length > 0"
            class="grid max-h-150 auto-rows-min grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            <button v-for="book in otherBooks" :key="book.id" class="text-left" @click="selectFeatured(book)">
              <BookCard :book="book" @edit="openEditForm" @delete="deleteBook" />
            </button>
          </div>

          <!-- Kanan kosong kalau cuma 1 buku -->
          <div v-else
            class="flex h-40 items-center justify-center rounded-2xl bg-white text-sm text-gray-400 shadow ring-1 ring-black/5">
            Belum ada buku lain
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <BaseModal :show="showForm" @close="closeForm">
      <BookForm :form="form" :is-edit="isEdit" :is-submitting="isSubmitting" @submit="submitForm" @cancel="closeForm"
        @cover-change="setCover" />
    </BaseModal>
  </div>
</template>
