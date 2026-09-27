<script setup lang="ts">
import { computed } from "vue";
import { PhCheck } from "@phosphor-icons/vue";
import type { Book } from "@/types/book";
import CoverImage from "./ios/CoverImage.vue";
import ProgressRing from "./ios/ProgressRing.vue";

const props = defineProps<{ book: Book }>();

const progressPercent = computed(() => {
  if (props.book.progress_percent !== undefined && props.book.progress_percent !== null) return Math.round(props.book.progress_percent);
  if (props.book.progress?.progress_percent !== undefined) return Math.round(props.book.progress.progress_percent);
  const total = props.book.pdf_total_pages ?? props.book.pages;
  if (!total || total <= 0) return 0;
  const current = props.book.current_page ?? props.book.pages_read ?? 0;
  return Math.min(100, Math.round((current / total) * 100));
});

const isReading = computed(() => props.book.status === "currently_reading");
const isFinished = computed(() => props.book.status === "finished");
</script>

<template>
  <div class="group flex flex-col gap-2">
    <div class="relative aspect-[2/3] w-full origin-left overflow-hidden rounded-[8px] bg-gray6 shadow-[0_1px_3px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out will-change-transform group-hover:[transform:perspective(900px)_translateY(-4px)_rotateY(-16deg)_rotateX(3deg)] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
      <CoverImage :cover="book.cover" :cover-url="book.cover_url" :title="book.name" :author="book.author" />
      <ProgressRing
        v-if="isReading"
        overlay
        :value="progressPercent"
        :size="34"
        class="absolute bottom-2 left-2"
      />
      <span
        v-if="isFinished"
        class="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-blue text-white shadow-sm"
        title="Selesai"
      >
        <PhCheck :size="13" weight="bold" />
      </span>
    </div>
    <div class="px-0.5">
      <p class="line-clamp-2 text-[14px] leading-snug font-semibold text-label">{{ book.name }}</p>
      <p class="truncate text-[13px] text-label2">{{ book.author || "Penulis tidak diketahui" }}</p>
    </div>
  </div>
</template>
