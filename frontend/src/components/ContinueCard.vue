<script setup lang="ts">
import { computed } from "vue";
import { PhPlay } from "@phosphor-icons/vue";
import type { Book } from "@/types/book";
import CoverImage from "./ios/CoverImage.vue";

const props = defineProps<{ book: Book }>();
const emit = defineEmits<{ (e: "open"): void; (e: "read"): void }>();

const progressPercent = computed(() => {
  if (props.book.progress_percent !== undefined && props.book.progress_percent !== null) return Math.round(props.book.progress_percent);
  if (props.book.progress?.progress_percent !== undefined) return Math.round(props.book.progress.progress_percent);
  const total = props.book.pdf_total_pages ?? props.book.pages;
  if (!total || total <= 0) return 0;
  const current = props.book.current_page ?? props.book.pages_read ?? 0;
  return Math.min(100, Math.round((current / total) * 100));
});

const currentPage = computed(() => props.book.current_page ?? props.book.pages_read ?? 0);
const totalPages = computed(() => props.book.pdf_total_pages ?? props.book.pages ?? 0);
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] bg-card p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-transform active:scale-[0.99]"
    @click="emit('open')"
    @keydown.enter="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <div class="h-[72px] w-[50px] shrink-0 overflow-hidden rounded-[6px]">
      <CoverImage :cover="book.cover" :cover-url="book.cover_url" :title="book.name" :author="book.author" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-[15px] font-semibold text-label">{{ book.name }}</p>
      <p class="truncate text-[13px] text-label2">{{ book.author || "Penulis tidak diketahui" }}</p>
      <div class="mt-2 flex items-center gap-2">
        <div class="h-1 flex-1 overflow-hidden rounded-full bg-gray5">
          <div class="h-full rounded-full bg-blue" :style="{ width: `${progressPercent}%` }" />
        </div>
        <span class="text-[12px] text-label2 tabular-nums">hal {{ currentPage }}/{{ totalPages }}</span>
      </div>
    </div>
    <button
      type="button"
      class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue text-white active:opacity-70 lg:h-9 lg:w-9"
      aria-label="Lanjutkan baca"
      title="Lanjutkan baca"
      @click.stop="emit('read')"
    >
      <PhPlay :size="15" weight="fill" />
    </button>
  </div>
</template>
