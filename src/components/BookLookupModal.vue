<script setup lang="ts">
import { ref } from "vue";
import { PhCalendarBlank, PhFileText, PhBarcode, PhMagnifyingGlass } from "@phosphor-icons/vue";
import type { ExternalBookResult } from "@/types/book";
import openLibraryService from "@/services/openLibraryService";
import BaseModal from "@/components/BaseModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import BookPlaceholder from "@/assets/placeholder.svg";

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", book: ExternalBookResult): void;
}>();

const searchQuery = ref("");
const isSearching = ref(false);
const searchResults = ref<ExternalBookResult[]>([]);
const hasSearched = ref(false);

async function handleSearch() {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  hasSearched.value = true;

  try {
    searchResults.value = await openLibraryService.searchBooks(searchQuery.value);
  } catch (error) {
    console.error("Book lookup error:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function selectBook(book: ExternalBookResult) {
  emit("select", book);
  emit("close");
  searchResults.value = [];
  searchQuery.value = "";
  hasSearched.value = false;
}
</script>

<template>
  <BaseModal :show="show" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-base-200 pb-3 dark:border-base-800">
        <div>
          <h3 class="font-display text-lg font-semibold text-base-900 dark:text-base-100">
            Cari & Auto-Fill Detail Buku
          </h3>
          <p class="mt-0.5 text-xs text-base-500 dark:text-base-400">
            Cari melalui judul buku, nama penulis, atau ISBN (via Google Books & Open Library)
          </p>
        </div>
      </div>

      <!-- Search Input -->
      <form @submit.prevent="handleSearch" class="flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Contoh: Atomic Habits atau 9780132350884..."
          class="flex-1 rounded-[0.25rem] border border-base-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-base-400 focus:border-terra-600 focus:outline-none dark:border-base-700 dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
          autofocus
        />
        <BaseButton type="submit" :disabled="isSearching || !searchQuery.trim()">
          <PhMagnifyingGlass :size="15" weight="bold" />
          <span>{{ isSearching ? "Mencari..." : "Cari" }}</span>
        </BaseButton>
      </form>

      <!-- Results Container -->
      <div class="max-h-96 min-h-[140px] overflow-y-auto pr-1">
        <!-- Loading State -->
        <div v-if="isSearching" class="flex flex-col items-center justify-center py-10 text-base-400">
          <div class="h-5 w-5 animate-spin border border-terra-600 border-t-transparent"></div>
          <span class="mt-2 text-xs">Mencari katalog buku...</span>
        </div>

        <!-- Empty Results -->
        <div
          v-else-if="hasSearched && searchResults.length === 0"
          class="py-10 text-center text-sm text-base-500"
        >
          Tidak ditemukan buku yang cocok untuk "{{ searchQuery }}". Coba gunakan kata kunci atau ISBN lain.
        </div>

        <!-- Initial Prompt -->
        <div
          v-else-if="!hasSearched"
          class="py-10 text-center text-xs text-base-400"
        >
          Ketik judul buku atau ISBN di atas untuk memulai pencarian.
        </div>

        <!-- List Results -->
        <div v-else class="space-y-2">
          <div
            v-for="(book, idx) in searchResults"
            :key="idx"
            @click="selectBook(book)"
            class="group flex cursor-pointer items-center gap-3.5 border border-base-200 bg-white p-3 transition-colors hover:border-terra-300 hover:bg-base-50 dark:border-base-800 dark:bg-base-900 dark:hover:border-terra-700 dark:hover:bg-base-800"
          >
            <!-- Thumbnail -->
            <img
              :src="book.thumbnail || BookPlaceholder"
              :alt="book.title"
              class="h-16 w-12 flex-shrink-0 border border-base-200 object-cover dark:border-base-700"
              referrerpolicy="no-referrer"
              loading="lazy"
              @error="(e) => ((e.target as HTMLImageElement).src = BookPlaceholder)"
            />

            <!-- Book Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <h4 class="truncate text-sm font-semibold text-base-900 dark:text-base-100">
                  {{ book.title }}
                </h4>
                <span
                  class="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  :class="book.source === 'google' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'"
                >
                  {{ book.source === 'google' ? 'Google' : 'OL' }}
                </span>
              </div>
              <p class="truncate text-xs text-base-500 dark:text-base-400">
                {{ book.authors.join(", ") }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-base-400 dark:text-base-500">
                <span v-if="book.publishedDate" class="inline-flex items-center gap-1">
                  <PhCalendarBlank :size="11" weight="bold" /> {{ book.publishedDate }}
                </span>
                <span v-if="book.pageCount" class="inline-flex items-center gap-1">
                  <PhFileText :size="11" weight="bold" /> {{ book.pageCount }} hal
                </span>
                <span v-if="book.isbn" class="inline-flex items-center gap-1 font-mono">
                  <PhBarcode :size="11" weight="bold" /> {{ book.isbn }}
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <button
              class="border border-base-300 bg-white px-2.5 py-1 text-xs font-medium text-base-700 transition-colors group-hover:border-terra-700 group-hover:bg-terra-700 group-hover:text-white dark:border-base-700 dark:bg-base-900 dark:text-base-200"
            >
              Pilih
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
