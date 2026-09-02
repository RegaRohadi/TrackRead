<script setup lang="ts">
import { computed } from "vue";
import type { Book } from "@/types/book";
import { PhBookOpen, PhCircle, PhBooks, PhBookmarkSimple, PhFilePdf } from "@phosphor-icons/vue";
import BookPlaceholder from "@/assets/placeholder.svg";

const props = defineProps<{ book: Book }>();

const storageBase = import.meta.env.VITE_STORAGE_BASE_URL || "http://localhost:8001/storage";
const coverUrl = (cover?: string | null, coverUrlProp?: string | null): string => {
  if (coverUrlProp) return coverUrlProp;
  if (!cover) return BookPlaceholder;
  if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
  return `${storageBase}/${cover}`;
};
function onCoverError(event: Event) { (event.target as HTMLImageElement).src = BookPlaceholder; }

const statusConfig = computed(() => {
  switch (props.book.status) {
    case "currently_reading": return { label: "Sedang dibaca", text: "text-terra-700 dark:text-terra-400", Icon: PhBookOpen };
    case "finished": return { label: "Selesai", text: "text-base-600 dark:text-base-300", Icon: PhCircle };
    case "dropped": return { label: "Berhenti", text: "text-base-400 dark:text-base-500", Icon: PhCircle };
    case "to_read": default: return { label: "Ingin dibaca", text: "text-base-500 dark:text-base-400", Icon: PhBookmarkSimple };
  }
});

const progressPercent = computed(() => {
  if (props.book.progress_percent !== undefined && props.book.progress_percent !== null) return Math.round(props.book.progress_percent);
  if (props.book.progress?.progress_percent !== undefined) return Math.round(props.book.progress.progress_percent);
  const tp = props.book.pdf_total_pages ?? props.book.pages;
  if (!tp || tp <= 0) return 0;
  const cp = props.book.current_page ?? props.book.pages_read ?? 0;
  return Math.min(100, Math.round((cp / tp) * 100));
});

const totalPages = computed(() => props.book.pdf_total_pages ?? props.book.pages);
const currentPage = computed(() => props.book.current_page ?? props.book.pages_read ?? 0);
</script>

<template>
  <div class="group flex h-full flex-col border border-base-200 bg-white transition-colors hover:border-base-300 dark:border-base-800 dark:bg-base-900 dark:hover:border-base-700">
    <div class="relative aspect-[3/4] w-full overflow-hidden bg-base-100 dark:bg-base-800">
      <img :src="coverUrl(book.cover, book.cover_url)" :alt="book.name" class="h-full w-full object-cover" referrerpolicy="no-referrer" loading="lazy" @error="onCoverError" />
      <span v-if="book.source === 'platform'" class="absolute left-2 top-2 rounded-[0.2rem] bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">PLATFORM</span>
      <span v-else class="absolute left-2 top-2 flex items-center gap-1 rounded-[0.2rem] bg-terra-700 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"><span class="h-1.5 w-1.5 rounded-full bg-white"></span>PRIVAT</span>
      <span v-if="book.has_pdf" class="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-base-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur"><PhFilePdf :size="10" weight="fill" /> PDF</span>
    </div>
    <div class="flex flex-1 flex-col p-3.5">
      <div class="flex items-center gap-2">
        <span v-if="book.genre" class="truncate rounded-[0.2rem] bg-base-100 px-1.5 py-0.5 text-[11px] font-medium text-base-600 dark:bg-base-800 dark:text-base-400">{{ book.genre }}</span>
        <span class="ml-auto flex items-center gap-1 text-[11px] font-medium text-base-400 dark:text-base-500"><PhBooks :size="12" /> {{ currentPage }}/{{ totalPages ?? 0 }} hal</span>
      </div>
      <h3 class="mt-2 font-display line-clamp-2 text-[15px] font-semibold leading-snug text-base-900 dark:text-base-100">{{ book.name }}</h3>
      <p class="mt-0.5 truncate text-xs text-base-500 dark:text-base-400">{{ book.author || "Penulis tidak diketahui" }}</p>
      <div v-if="totalPages" class="mt-2">
        <div class="flex justify-between text-[10px] text-base-400"><span>{{ progressPercent }}% selesai</span><span v-if="progressPercent>0">hal {{ currentPage }}/{{ totalPages }}</span></div>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-base-100 dark:bg-base-800"><div class="h-full bg-terra-600 transition-all" :style="{ width: progressPercent + '%' }"></div></div>
      </div>
      <div class="mt-auto flex items-center gap-1.5 pt-3">
        <component :is="statusConfig.Icon" :size="11" weight="fill" class="shrink-0" :class="statusConfig.text" />
        <span class="text-[11px] font-medium" :class="statusConfig.text">{{ statusConfig.label }}</span>
        <div v-if="totalPages" class="ml-auto h-1 w-14 overflow-hidden bg-base-100 dark:bg-base-800"><div class="h-full bg-terra-600 transition-all duration-300" :style="{ width: `${progressPercent}%` }"></div></div>
      </div>
    </div>
  </div>
</template>
