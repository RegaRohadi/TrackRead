<script setup lang="ts">
import type { Book } from "@/types/book";
import BookPlaceholder from "@/assets/placeholder.svg";

const props = defineProps<{
  book: Book;
}>();

const emit = defineEmits<{
  (e: "edit", book: Book): void;
  (e: "delete", id: number): void;
}>();

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const coverUrl = (cover?: string | null): string => {
  return cover
    ? `http://localhost:8000/storage/${cover}`
    : BookPlaceholder;
};
</script>

<template>
  <div
    class="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-md">
    <img :src="coverUrl(book.cover)" :alt="book.name" class="h-56 w-full object-cover" />

    <div class="p-4">
      <span class="mb-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        {{ book.genre }}
      </span>

      <h2 class="line-clamp-2 text-lg font-semibold text-gray-900">
        {{ book.name }}
      </h2>

      <p class="mt-1 text-sm text-gray-500">
        {{ book.author }}
      </p>
    </div>
  </div>
</template>
