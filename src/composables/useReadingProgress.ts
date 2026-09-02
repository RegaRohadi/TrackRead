import { ref } from "vue";
import BookService from "@/services/bookservice";

export function useReadingProgress(bookId: number) {
  const currentPage = ref(1);
  const totalPages = ref<number | null>(null);
  const progressPercent = ref(0);
  const saving = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const calc = () => {
    if (!totalPages.value) return 0;
    progressPercent.value = Math.min(100, Math.round((currentPage.value / totalPages.value) * 1000) / 10);
    return progressPercent.value;
  };

  const load = async () => {
    try {
      const data = await BookService.getProgress(bookId);
      currentPage.value = data.current_page || 1;
      totalPages.value = data.total_pages;
      calc();
    } catch {}
  };

  const save = async (page: number) => {
    currentPage.value = page;
    calc();
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      saving.value = true;
      try {
        await BookService.saveProgress(bookId, page);
      } catch {}
      saving.value = false;
    }, 800);
  };

  return { currentPage, totalPages, progressPercent, saving, load, save, calc };
}
