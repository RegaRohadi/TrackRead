<script setup lang="ts">
import { ref } from "vue";
import { PhMagnifyingGlass, PhPlus } from "@phosphor-icons/vue";
import type { ExternalBookResult } from "@/types/book";
import openLibraryService from "@/services/openLibraryService";
import BaseModal from "@/components/BaseModal.vue";
import CoverImage from "@/components/ios/CoverImage.vue";

defineProps<{ show: boolean }>();

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
  <BaseModal :show="show" title="Cari &amp; Auto-Isi" @close="emit('close')">
    <form @submit.prevent="handleSearch" class="flex items-center gap-2 rounded-[10px] bg-fill px-3 py-2">
      <PhMagnifyingGlass :size="17" class="shrink-0 text-label2" weight="bold" />
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Judul, penulis, atau ISBN..."
        class="min-w-0 flex-1 border-none bg-transparent text-[16px] text-label outline-none placeholder:text-label3"
        autofocus
      />
      <button type="submit" :disabled="isSearching || !searchQuery.trim()" class="tap-expand shrink-0 text-[15px] font-semibold text-blue-text disabled:opacity-40">
        {{ isSearching ? "..." : "Cari" }}
      </button>
    </form>

    <div class="mt-4 max-h-[55vh] overflow-y-auto">
      <div v-if="isSearching" class="flex items-center justify-center gap-2 py-10 text-label2">
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray3 border-t-transparent"></span>
        <span class="text-[15px]">Mencari katalog...</span>
      </div>

      <p v-else-if="hasSearched && searchResults.length === 0" class="py-10 text-center text-[15px] text-label2">
        Tidak ditemukan untuk "{{ searchQuery }}".
      </p>

      <p v-else-if="!hasSearched" class="py-10 text-center text-[15px] text-label2">
        Cari judul atau ISBN untuk memulai.
      </p>

      <div v-else class="overflow-hidden rounded-[12px] bg-bg2 [&>*+*]:border-t [&>*+*]:border-sep dark:bg-gray6">
        <button
          v-for="(book, idx) in searchResults"
          :key="idx"
          type="button"
          class="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-fill"
          @click="selectBook(book)"
        >
          <div class="h-[60px] w-[42px] shrink-0 overflow-hidden rounded-[5px]">
            <CoverImage :cover="book.thumbnail" :title="book.title" :author="book.authors?.join(', ')" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[15px] font-semibold text-label">{{ book.title }}</p>
            <p class="truncate text-[13px] text-label2">{{ book.authors.join(", ") || "Tanpa penulis" }}</p>
            <p class="truncate text-[12px] text-label3">
              <span v-if="book.publishedDate">{{ book.publishedDate }} · </span>{{ book.source === "google" ? "Google Books" : "Open Library" }}
            </p>
          </div>
          <PhPlus :size="18" weight="bold" class="shrink-0 text-blue-text" />
        </button>
      </div>
    </div>
  </BaseModal>
</template>
