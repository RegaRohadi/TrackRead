import { onBeforeUnmount, ref } from "vue";
import BookService from "@/services/bookservice";

const IDLE_MS = 3000;
const MAX_WAIT_MS = 30000;
const RETRY_MS = 10000;

export interface ProgressHint {
  page: number;
  total: number | null;
  at: number;
}

function storageKey(bookId: number): string {
  return `trackread_progress_${bookId}`;
}

export function readProgressHint(bookId: number): ProgressHint | null {
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProgressHint;
    if (!parsed || typeof parsed.page !== "number" || parsed.page < 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Syncs reading progress lazily: page turns only mark the position locally,
 * the server is updated after a short idle period, at a max interval while
 * reading continuously, and immediately when the page is left or hidden.
 */
export function useProgressSync(bookId: number) {
  const saving = ref(false);
  const failed = ref(false);
  const pendingPage = ref<number | null>(null);
  const lastSavedPage = ref<number | null>(null);
  let pendingTotal: number | null = null;

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let destroyed = false;

  function clearTimer(timer: ReturnType<typeof setTimeout> | null): null {
    if (timer) clearTimeout(timer);
    return null;
  }

  function writeHint(page: number, total: number | null) {
    try {
      localStorage.setItem(storageKey(bookId), JSON.stringify({ page, total, at: Date.now() } satisfies ProgressHint));
    } catch {
      /* ignore storage errors */
    }
  }

  function scheduleIdle() {
    if (destroyed) return;
    idleTimer = clearTimer(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      void flush();
    }, IDLE_MS);
  }

  function scheduleRetry() {
    if (destroyed || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void flush();
    }, RETRY_MS);
  }

  function queueSave(page: number, total: number | null = null) {
    if (!Number.isFinite(page) || page < 1) return;
    pendingPage.value = page;
    pendingTotal = total && total > 0 ? total : pendingTotal;
    writeHint(page, total);

    if (retryTimer) retryTimer = clearTimer(retryTimer);
    failed.value = false;
    scheduleIdle();

    if (!maxWaitTimer && page !== lastSavedPage.value) {
      maxWaitTimer = setTimeout(() => {
        maxWaitTimer = null;
        void flush();
      }, MAX_WAIT_MS);
    }
  }

  async function flush(options: { keepalive?: boolean } = {}) {
    idleTimer = clearTimer(idleTimer);
    maxWaitTimer = clearTimer(maxWaitTimer);

    const page = pendingPage.value;
    if (page == null || page === lastSavedPage.value || inFlight) return;

    inFlight = true;
    saving.value = true;
    try {
      await BookService.saveProgress(bookId, page, { ...options, totalPages: pendingTotal });
      lastSavedPage.value = page;
      failed.value = false;
    } catch {
      failed.value = true;
      scheduleRetry();
    } finally {
      inFlight = false;
      saving.value = false;

      if (pendingPage.value != null && pendingPage.value !== lastSavedPage.value && !retryTimer) {
        scheduleIdle();
      }
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "hidden") void flush({ keepalive: true });
  }

  function handlePageHide() {
    void flush({ keepalive: true });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);

  onBeforeUnmount(() => {
    destroyed = true;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);

    if (pendingPage.value != null && pendingPage.value !== lastSavedPage.value) {
      void flush({ keepalive: true });
    }

    idleTimer = clearTimer(idleTimer);
    maxWaitTimer = clearTimer(maxWaitTimer);
    retryTimer = clearTimer(retryTimer);
  });

  return { saving, failed, pendingPage, lastSavedPage, queueSave, flush };
}
