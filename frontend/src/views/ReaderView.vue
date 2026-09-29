<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ePub from "epubjs";
import { PhArrowLeft, PhMagnifyingGlassPlus, PhMagnifyingGlassMinus, PhArrowsOut, PhCaretDoubleDown, PhCaretLeft, PhCaretRight, PhBookOpen, PhList, PhCards, PhTextAa, PhSun, PhMoon } from "@phosphor-icons/vue";
import BookService from "@/services/bookservice";
import { useTheme } from "@/composables/useTheme";
import { readProgressHint, useProgressSync } from "@/composables/useProgressSync";
import StatusSelect from "@/components/StatusSelect.vue";
import type { Book, ReadingStatus } from "@/types/book";
import api from "@/services/api";

(pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = workerUrl;

type EpubBook = ReturnType<typeof ePub>;
type EpubRendition = ReturnType<EpubBook["renderTo"]>;
interface EpubLocation {
  start?: { cfi?: string; percentage?: number; index?: number; location?: number };
}
interface EpubLocations {
  generate(chars: number): Promise<unknown>;
  cfiFromLocation(location: number): string | null;
  total: number;
}

const route = useRoute();
const router = useRouter();
const { theme, toggleTheme } = useTheme();
const id = computed(() => Number(route.params.id));
const book = ref<Book | null>(null);
const loading = ref(true);
const pdfLoading = ref(false);
const epubLoading = ref(false);
const error = ref("");
const chromeVisible = ref(true);
const showControlPopover = ref(false);
const showJumpPopover = ref(false);
const settingsRef = ref<HTMLElement | null>(null);
const jumpRef = ref<HTMLElement | null>(null);
const totalPages = ref(0);
const currentPage = ref(1);
const scale = ref(1.15);
const fontScale = ref(100);
const progress = useProgressSync(Number(route.params.id));
const { saving } = progress;
const initialProgress = ref<number | null>(null);
const initialProgressTotal = ref<number | null>(null);
let pendingHintSync: number | null = null;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const scrollContainerRef = ref<HTMLDivElement | null>(null);
const epubContainerRef = ref<HTMLDivElement | null>(null);
let pdfDoc: pdfjs.PDFDocumentProxy | null = null;
let renderTask: pdfjs.RenderTask | null = null;
let epubBook: EpubBook | null = null;
let rendition: EpubRendition | null = null;
let epubLocationsReady: Promise<unknown> | null = null;
let epubLocationsReadyResolved = false;
let epubRestoreGuard = true;
const epubLocationsTotal = ref(0);
const fileBlobUrl = ref<string | null>(null);
const mode = ref<"page" | "scroll">((localStorage.getItem("trackread_reader_mode") as "page" | "scroll") || "page");
const pageCanvasMap = new Map<number, HTMLCanvasElement>();
let observer: IntersectionObserver | null = null;
let renderAllAbort = false;

const fileType = computed<"pdf" | "epub" | null>(() => {
  if (book.value?.file_type) return book.value.file_type;
  if (book.value?.has_file || book.value?.has_pdf) return "pdf";
  return null;
});
const isEpub = computed(() => fileType.value === "epub");
const readerBusy = computed(() => loading.value || pdfLoading.value || epubLoading.value);
const progressPercent = computed(() => totalPages.value ? Math.min(100, Math.round((currentPage.value / totalPages.value) * 1000) / 10) : 0);
const jumpInput = ref("1");

let swipeStart: { x: number; y: number; t: number } | null = null;
let lastSwipeAt = 0;

function onSwipeDown(e: PointerEvent) {
  swipeStart = { x: e.clientX, y: e.clientY, t: Date.now() };
}

function onSwipeUp(e: PointerEvent) {
  const start = swipeStart;
  swipeStart = null;
  if (!start) return;
  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  if (Date.now() - start.t < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    lastSwipeAt = Date.now();
    go(dx < 0 ? 1 : -1);
  }
}

function tapGo(delta: number) {
  if (Date.now() - lastSwipeAt < 350) return;
  go(delta);
}

function tapToggleChrome() {
  if (Date.now() - lastSwipeAt < 350) return;
  toggleChrome();
}

function getEpubLocations(): EpubLocations | null {
  return epubBook ? (epubBook.locations as unknown as EpubLocations) : null;
}

function toggleChrome() {
  chromeVisible.value = !chromeVisible.value;
  showControlPopover.value = false;
  showJumpPopover.value = false;
}

function toggleJump() {
  showJumpPopover.value = !showJumpPopover.value;
  showControlPopover.value = false;
}

function onDocumentPointerDown(e: PointerEvent) {
  const target = e.target as Node | null;
  if (!target) return;
  if (showControlPopover.value && settingsRef.value && !settingsRef.value.contains(target)) {
    showControlPopover.value = false;
  }
  if (showJumpPopover.value && jumpRef.value && !jumpRef.value.contains(target)) {
    showJumpPopover.value = false;
  }
}

function applyEpubTheme() {
  if (!rendition) return;
  const dark = theme.value === "dark";
  rendition.themes.default({
    body: {
      background: dark ? "#1c1c1e" : "#ffffff",
      color: dark ? "#e6e6ea" : "#1c1c1e",
      "line-height": "1.7",
      padding: "0 6px",
    },
    a: { color: dark ? "#0a84ff" : "#007aff" },
    img: { "max-width": "100%" },
  });
}

watch(theme, () => applyEpubTheme());

watch(chromeVisible, async () => {
  if (!isEpub.value) return;
  await nextTick();
  setTimeout(onResize, 320);
});

function setMode(m: "page" | "scroll") {
  if (mode.value === m) return;
  mode.value = m;
  localStorage.setItem("trackread_reader_mode", m);
}

watch(mode, async (m) => {
  if (isEpub.value || !pdfDoc || loading.value || error.value) return;
  await nextTick();
  if (m === "scroll") {
    await renderAllPages();
    setupObserver();
    scrollToPage(currentPage.value, false);
  } else {
    teardownObserver();
    await nextTick();
    await renderPage(currentPage.value);
  }
});

watch(scale, async () => {
  if (isEpub.value || !pdfDoc) return;
  if (mode.value === "scroll") await renderAllPages();
  else await renderPage(currentPage.value);
});

function setPageCanvas(n: number, el: unknown) {
  const c = el as HTMLCanvasElement | null;
  if (c) pageCanvasMap.set(n, c);
  else pageCanvasMap.delete(n);
}

function debouncedSave(page: number) {
  progress.queueSave(page, totalPages.value || null);
}

async function fetchBook() {
  try {
    book.value = await BookService.getOne(id.value);
    totalPages.value = book.value.pdf_total_pages ?? book.value.pages ?? 0;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err?.response?.status === 403) error.value = "Kamu tidak punya akses ke buku ini.";
    else if (err?.response?.status === 404) error.value = "Buku tidak ditemukan.";
    else error.value = "Gagal memuat buku.";
    return;
  }

  try {
    const prog = await BookService.getProgress(id.value);
    if (prog.current_page >= 1) {
      initialProgress.value = prog.current_page;
      initialProgressTotal.value = prog.total_pages ?? null;
    }

    const hint = readProgressHint(id.value);
    const serverAt = prog.last_read_at ? new Date(prog.last_read_at).getTime() : 0;
    if (hint && hint.page !== initialProgress.value && hint.at > serverAt) {
      initialProgress.value = hint.page;
      initialProgressTotal.value = hint.total ?? initialProgressTotal.value;
      pendingHintSync = hint.page;
    }
  } catch {}
}

async function fetchBookBlob(): Promise<Blob> {
  const res = await api.get(`/books/${id.value}/file`, { responseType: "blob" });
  const blob = res.data as Blob;
  if (fileBlobUrl.value) URL.revokeObjectURL(fileBlobUrl.value);
  fileBlobUrl.value = URL.createObjectURL(blob);
  return blob;
}

async function loadPdf() {
  if (!fileBlobUrl.value) return;
  pdfLoading.value = true;
  try {
    const doc = await pdfjs.getDocument({ url: fileBlobUrl.value, cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/cmaps/", cMapPacked: true }).promise;
    pdfDoc = doc;
    totalPages.value = doc.numPages;
    if (book.value && !book.value.pdf_total_pages) book.value.pdf_total_pages = doc.numPages;
    if (initialProgress.value && initialProgress.value >= 1 && initialProgress.value <= doc.numPages) {
      currentPage.value = initialProgress.value;
      jumpInput.value = String(initialProgress.value);
    }
    await nextTick();
    if (mode.value === "scroll") {
      await renderAllPages();
      setupObserver();
      await nextTick();
      scrollToPage(currentPage.value, false);
    } else {
      await renderPage(currentPage.value);
    }
  } finally {
    pdfLoading.value = false;
  }
}

async function loadEpub(blob: Blob) {
  epubLoading.value = true;
  try {
    epubBook = ePub(await blob.arrayBuffer());
    await epubBook.ready;

    const locations = getEpubLocations();
    if (locations) {
      epubLocationsReady = locations.generate(1600).then(() => {
        epubLocationsReadyResolved = true;
        epubLocationsTotal.value = locations.total;
      }).catch(() => {});
      // Locations and percentages must exist before the reader may turn pages,
      // otherwise epub.js reports a bogus percentage of 0.
      await epubLocationsReady;
    }

    // One page per epub.js location keeps page numbers and positions in sync.
    const epubPageCount = locations && locations.total > 0 ? locations.total + 1 : totalPages.value;
    if (epubPageCount > 0) totalPages.value = epubPageCount;

    let startPage = initialProgress.value && initialProgress.value >= 1 ? initialProgress.value : 1;
    const savedTotal = initialProgressTotal.value;
    if (savedTotal && savedTotal > 1 && epubPageCount > 1 && savedTotal !== epubPageCount) {
      // Progress saved with a different page scheme: convert by percentage.
      startPage = Math.max(1, Math.min(epubPageCount, Math.round(((startPage - 1) / (savedTotal - 1)) * (epubPageCount - 1)) + 1));
      pendingHintSync = startPage;
    }
    startPage = Math.max(1, Math.min(epubPageCount || startPage, startPage));

    await nextTick();
    if (!epubContainerRef.value) return;

    rendition = epubBook.renderTo(epubContainerRef.value, { width: "100%", height: "100%", flow: "paginated", spread: "none" });
    rendition.themes.fontSize(`${fontScale.value}%`);
    applyEpubTheme();

    let displayed = false;
    if (startPage > 1 && locations) {
      try {
        const cfi = locations.cfiFromLocation(Math.max(0, Math.min(locations.total, startPage - 1)));
        if (cfi) {
          await rendition.display(cfi);
          displayed = true;
        }
      } catch {}
    }

    if (!displayed) await rendition.display();

    // The saved page number is authoritative for the page indicator.
    currentPage.value = displayed || startPage === 1 ? startPage : 1;
    jumpInput.value = String(currentPage.value);

    rendition.on("relocated", onEpubRelocated);
    window.addEventListener("resize", onResize);
  } finally {
    epubLoading.value = false;
  }
}

function applyEpubLocation(start: EpubLocation["start"] | undefined) {
  if (!start || !epubLocationsReadyResolved) return;
  const total = totalPages.value || epubLocationsTotal.value;
  if (!total) return;

  let page: number | null = null;
  if (typeof start.location === "number" && epubLocationsTotal.value > 0) {
    page = Math.min(total, Math.max(1, start.location + 1));
  } else if (typeof start.percentage === "number") {
    page = Math.min(total, Math.max(1, Math.round(start.percentage * (total - 1)) + 1));
  }
  if (page === null) return;

  if (page === currentPage.value) return;
  currentPage.value = page;
  jumpInput.value = String(page);
  debouncedSave(page);
}

function onEpubRelocated(location: EpubLocation) {
  // Ignore relocations caused by the initial restore display; the saved page
  // number stays authoritative until the reader turns a page themselves.
  if (epubRestoreGuard) return;
  applyEpubLocation(location?.start);
}

function onResize() {
  if (!rendition || !epubContainerRef.value) return;
  const rect = epubContainerRef.value.getBoundingClientRect();
  if (rect.width && rect.height) rendition.resize(rect.width, rect.height);
}

async function displayEpubPage(n: number) {
  const locations = getEpubLocations();
  if (!rendition || !locations) return;
  epubRestoreGuard = false;
  currentPage.value = n;
  jumpInput.value = String(n);
  try {
    await epubLocationsReady;
    const target = Math.max(0, Math.min(locations.total, n - 1));
    const cfi = locations.cfiFromLocation(target);
    if (cfi) await rendition.display(cfi);
    debouncedSave(n);
  } catch {}
}

async function renderPage(num: number) {
  if (!pdfDoc) return;
  if (!canvasRef.value) await nextTick();
  if (!canvasRef.value) return;
  if (renderTask) { try { renderTask.cancel(); } catch {} }
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: scale.value });
  const canvas = canvasRef.value!;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";
  renderTask = (page as unknown as { render: (p: unknown) => pdfjs.RenderTask }).render({ canvasContext: ctx, viewport });
  try { await renderTask.promise; } catch (e: unknown) { if ((e as { name?: string })?.name === "RenderingCancelledException") return; }
}

async function renderAllPages() {
  if (!pdfDoc || !totalPages.value) return;
  renderAllAbort = false;
  await nextTick();
  for (let n = 1; n <= totalPages.value; n++) {
    if (renderAllAbort) break;
    const canvas = pageCanvasMap.get(n);
    if (!canvas) continue;
    try {
      const page = await pdfDoc.getPage(n);
      const viewport = page.getViewport({ scale: scale.value });
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      const task = (page as unknown as { render: (p: unknown) => pdfjs.RenderTask }).render({ canvasContext: ctx, viewport });
      await task.promise;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "RenderingCancelledException") continue;
    }
  }
}

function setupObserver() {
  teardownObserver();
  if (!scrollContainerRef.value) return;
  const root = scrollContainerRef.value;
  const els = root.querySelectorAll<HTMLElement>("[data-page]");
  if (!els.length) return;
  let ticking = false;
  observer = new IntersectionObserver(
    (entries) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        let best: IntersectionObserverEntry | null = null;
        let maxRatio = 0;
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > maxRatio) {
            maxRatio = e.intersectionRatio;
            best = e;
          }
        }
        if (!best) {
          for (const e of entries) {
            if (e.boundingClientRect.top >= 0 && e.boundingClientRect.top < root.clientHeight * 0.6) { best = e; break; }
          }
        }
        if (best) {
          const n = Number((best.target as HTMLElement).dataset.page);
          if (n && n !== currentPage.value) {
            currentPage.value = n;
            jumpInput.value = String(n);
            debouncedSave(n);
          }
        }
        ticking = false;
      });
    },
    { root, threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "0px 0px -40% 0px" }
  );
  els.forEach((el) => observer!.observe(el));
}

function teardownObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

function scrollToPage(n: number, smooth = true) {
  if (mode.value !== "scroll" || !scrollContainerRef.value) return;
  const el = scrollContainerRef.value.querySelector<HTMLElement>(`[data-page="${n}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "instant" as ScrollBehavior, block: "start" });
}

function onPageTap(e: MouseEvent) {
  if (readerBusy.value || Date.now() - lastSwipeAt < 350) return;
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width) return;
  const ratio = (e.clientX - rect.left) / rect.width;
  if (ratio < 0.2) go(-1);
  else if (ratio > 0.8) go(1);
  else toggleChrome();
}

function go(delta: number) {
  if (readerBusy.value) return;
  if (isEpub.value) {
    if (!rendition) return;
    epubRestoreGuard = false;
    if (delta > 0) void rendition.next();
    else void rendition.prev();
    return;
  }
  const next = Math.min(totalPages.value || 9999, Math.max(1, currentPage.value + delta));
  if (next === currentPage.value) return;
  currentPage.value = next;
  jumpInput.value = String(next);
  if (mode.value === "scroll") {
    scrollToPage(next, true);
    debouncedSave(next);
  } else {
    renderPage(next);
    debouncedSave(next);
  }
}

function jump() {
  showJumpPopover.value = false;
  if (readerBusy.value) return;
  const n = Number(jumpInput.value);
  if (!Number.isFinite(n) || n < 1 || (totalPages.value && n > totalPages.value)) { jumpInput.value = String(currentPage.value); return; }
  if (isEpub.value) { void displayEpubPage(n); return; }
  currentPage.value = n;
  if (mode.value === "scroll") { scrollToPage(n, true); debouncedSave(n); }
  else { renderPage(n); debouncedSave(n); }
}

function onSliderInput() {
  jumpInput.value = String(currentPage.value);
  if (isEpub.value) { void displayEpubPage(currentPage.value); return; }
  if (mode.value === "scroll") { scrollToPage(currentPage.value, true); debouncedSave(currentPage.value); }
  else { renderPage(currentPage.value); debouncedSave(currentPage.value); }
}

function onRangeInput(e: Event) {
  if (readerBusy.value) return;
  const target = e.target as HTMLInputElement;
  const n = Number(target.value);
  if (!Number.isFinite(n)) return;
  currentPage.value = n;
  onSliderInput();
}

function zoom(delta: number) {
  scale.value = Math.min(2.5, Math.max(0.6, scale.value + delta));
}

function zoomFont(delta: number) {
  fontScale.value = Math.min(250, Math.max(60, fontScale.value + delta));
  rendition?.themes.fontSize(`${fontScale.value}%`);
}

function zoomIn() {
  if (isEpub.value) zoomFont(10);
  else zoom(0.15);
}

function zoomOut() {
  if (isEpub.value) zoomFont(-10);
  else zoom(-0.15);
}

function toggleFullscreen() {
  const el = containerRef.value;
  if (!el) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else el.requestFullscreen();
}

const markingFinished = ref(false);

async function changeStatus(status: ReadingStatus) {
  if (!book.value || book.value.status === status || markingFinished.value) return;
  markingFinished.value = true;
  try {
    const updated = await BookService.updateStatus(book.value.id, status);
    if (updated) book.value = { ...book.value, ...updated, status };
  } catch {
    /* status change failed; leave the book as it was */
  } finally {
    markingFinished.value = false;
  }
}

watch(progressPercent, (percent) => {
  if (percent >= 100 && book.value && book.value.status !== "finished") {
    book.value = { ...book.value, status: "finished" };
  }
});

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
  if (e.key === "+" || e.key === "=") zoomIn();
  if (e.key === "-") zoomOut();
  if (e.key === "Escape") {
    if (showControlPopover.value || showJumpPopover.value) {
      showControlPopover.value = false;
      showJumpPopover.value = false;
    } else {
      toggleChrome();
    }
  }
}

onMounted(async () => {
  loading.value = true;
  await fetchBook();
  if (error.value) { loading.value = false; return; }
  if (!book.value?.has_file && !book.value?.has_pdf) {
    error.value = "Buku ini belum memiliki berkas untuk dibaca.";
    loading.value = false;
    return;
  }
  let blob: Blob;
  try {
    blob = await fetchBookBlob();
  } catch {
    error.value = "Berkas buku tidak bisa dibuka. Coba unggah ulang dari perangkatmu.";
    loading.value = false;
    return;
  }
  loading.value = false;
  await nextTick();
  try {
    if (isEpub.value) await loadEpub(blob);
    else await loadPdf();
  } catch {
    error.value = "Gagal membuka berkas buku.";
  }
  if (pendingHintSync !== null) {
    debouncedSave(currentPage.value);
    pendingHintSync = null;
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pointerdown", onDocumentPointerDown);
  window.removeEventListener("resize", onResize);
  teardownObserver();
  renderAllAbort = true;
  if (fileBlobUrl.value) URL.revokeObjectURL(fileBlobUrl.value);
  if (pdfDoc) { try { pdfDoc.destroy(); } catch {} }
  if (rendition) { try { rendition.destroy(); } catch {} rendition = null; }
  if (epubBook) { try { epubBook.destroy(); } catch {} epubBook = null; }
});

async function back() {
  await progress.flush();
  router.push({ name: "books" });
}
</script>

<template>
  <div ref="containerRef" class="relative h-[100dvh] overflow-hidden bg-grouped">
    <!-- Always-visible progress line -->
    <div class="absolute inset-x-0 top-0 z-40 h-[3px] bg-gray5/70">
      <div class="h-full w-full origin-left bg-blue transition-transform duration-300" :style="{ transform: `scaleX(${progressPercent / 100})` }"></div>
    </div>

    <!-- Top bar -->
    <header
      data-testid="reader-topbar"
      :inert="!chromeVisible"
      class="absolute inset-x-0 top-0 z-30 backdrop-blur-xl transition-[transform,opacity] duration-300 ease-out"
      :class="chromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'"
      style="background: var(--ios-bar)"
    >
      <div class="pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-gradient-to-b from-black/5 to-transparent" aria-hidden="true"></div>
      <div class="mx-auto flex max-w-4xl items-center gap-1 px-2 py-1.5">
        <button class="tap-expand flex h-11 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[16px] font-medium text-blue-text active:opacity-60 lg:h-9" data-testid="reader-back" @click="back">
          <PhArrowLeft :size="19" weight="bold" />
          <span class="hidden sm:inline">Katalog</span>
        </button>
        <div class="min-w-0 flex-1 text-center">
          <p class="truncate text-[15px] font-semibold leading-tight text-label" data-testid="reader-title">{{ book?.name || "Reader" }}</p>
          <p class="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] leading-none text-label2">
            <span class="rounded-[5px] px-1.5 py-[2px] text-[11px] font-bold uppercase tracking-wider" :class="isEpub ? 'bg-blue/15 text-blue-text' : 'bg-red/15 text-red-text'">{{ isEpub ? "EPUB" : "PDF" }}</span>
            <span class="tabular-nums" data-testid="reader-top-progress">Hal {{ currentPage }}/{{ totalPages || "?" }} · {{ progressPercent }}%</span>
            <span v-if="saving" class="text-blue-text">menyimpan…</span>
          </p>
        </div>
        <div ref="settingsRef" class="relative shrink-0">
          <button class="grid h-11 w-11 place-items-center lg:h-9 lg:w-9 rounded-full text-blue-text active:opacity-60" data-testid="reader-settings-btn" title="Pengaturan tampilan" @click="showControlPopover = !showControlPopover; showJumpPopover = false">
            <PhTextAa :size="19" weight="bold" />
          </button>
          <Transition name="pop">
            <div v-if="showControlPopover" data-testid="reader-settings" class="absolute right-0 top-11 z-40 w-60 origin-top-right rounded-[14px] border border-sep bg-card p-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-medium text-label2">{{ isEpub ? "Ukuran huruf" : "Zoom" }}</span>
                <div class="flex items-center gap-1">
                  <button class="grid h-11 w-11 place-items-center rounded-full bg-fill text-blue-text active:opacity-60 lg:h-8 lg:w-8" data-testid="reader-zoom-out" @click="zoomOut"><PhMagnifyingGlassMinus :size="15" weight="bold" /></button>
                  <span class="w-11 text-center text-[12px] font-semibold text-label tabular-nums" data-testid="reader-zoom-value">{{ isEpub ? fontScale : Math.round(scale * 100) }}%</span>
                  <button class="grid h-11 w-11 place-items-center rounded-full bg-fill text-blue-text active:opacity-60 lg:h-8 lg:w-8" data-testid="reader-zoom-in" @click="zoomIn"><PhMagnifyingGlassPlus :size="15" weight="bold" /></button>
                </div>
              </div>
              <div v-if="!isEpub" class="mt-3">
                <span class="text-[12px] font-medium text-label2">Mode baca</span>
                <div class="mt-1.5 flex rounded-[10px] bg-fill p-0.5">
                  <button class="tap-expand flex flex-1 items-center justify-center gap-1 rounded-[8px] px-2 py-1.5 text-[12px] font-semibold transition-colors" :class="mode === 'page' ? 'bg-card text-label shadow-sm' : 'text-label2'" data-testid="reader-mode-page" @click="setMode('page'); showControlPopover = false"><PhCards :size="13" weight="bold" />Halaman</button>
                  <button class="tap-expand flex flex-1 items-center justify-center gap-1 rounded-[8px] px-2 py-1.5 text-[12px] font-semibold transition-colors" :class="mode === 'scroll' ? 'bg-card text-label shadow-sm' : 'text-label2'" data-testid="reader-mode-scroll" @click="setMode('scroll'); showControlPopover = false"><PhList :size="13" weight="bold" />Gulir</button>
                </div>
              </div>
              <div class="mt-3 border-t border-sep pt-3">
                <span class="mb-1.5 block text-[12px] font-medium text-label2">Status membaca</span>
                <StatusSelect
                  full
                  :model-value="book?.status ?? 'to_read'"
                  :disabled="markingFinished"
                  @update:model-value="changeStatus"
                />
              </div>
            </div>
          </Transition>
        </div>
        <button class="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-blue-text active:opacity-60 lg:grid" data-testid="reader-fullscreen" title="Layar penuh" @click="toggleFullscreen">
          <PhArrowsOut :size="17" weight="bold" />
        </button>
        <button class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-blue-text active:opacity-60 lg:h-9 lg:w-9" data-testid="reader-theme-toggle" :title="theme === 'dark' ? 'Mode terang' : 'Mode gelap'" @click="toggleTheme">
          <PhMoon v-if="theme === 'dark'" :size="18" weight="fill" />
          <PhSun v-else :size="18" weight="fill" />
        </button>
      </div>
    </header>

    <!-- Floating restore button -->
    <button
      v-if="!chromeVisible && !loading && !error"
      class="absolute right-3 top-3 z-30 grid h-11 w-11 place-items-center rounded-full border border-sep/60 bg-card/95 text-blue-text shadow-lg backdrop-blur transition-opacity active:opacity-70"
      data-testid="reader-show-chrome"
      title="Tampilkan kontrol"
      @click="toggleChrome"
    >
      <PhCaretDoubleDown :size="18" weight="bold" />
    </button>

    <!-- Content -->
    <main
      class="absolute inset-0"
      :class="chromeVisible ? 'pt-[62px] pb-[84px]' : 'pt-0 pb-0'"
      data-testid="reader-content"
    >
      <div v-if="loading" class="flex h-full flex-col items-center justify-center px-4 text-center">
        <div class="h-9 w-9 animate-spin rounded-full border-2 border-gray3 border-t-transparent"></div>
        <p class="mt-3 text-[15px] text-label2">Memuat {{ fileType === "epub" ? "EPUB" : "PDF" }}...</p>
      </div>

      <div v-else-if="error" class="flex h-full items-center justify-center px-4">
        <div class="w-full max-w-sm rounded-[16px] bg-card px-6 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
          <PhBookOpen :size="34" class="mx-auto text-blue-text" />
          <p class="mt-3 text-[15px] font-medium text-label">{{ error }}</p>
          <button class="mt-4 rounded-[10px] bg-blue px-4 py-2 text-[15px] font-semibold text-white active:opacity-80" @click="back">Kembali ke Katalog</button>
        </div>
      </div>

      <!-- EPUB -->
      <div v-else-if="isEpub" class="h-full px-2 py-2 sm:px-4 sm:py-3">
        <div class="relative mx-auto h-full max-w-xl overflow-hidden rounded-[14px] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div v-if="epubLoading" class="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-card text-[15px] text-label2" data-testid="epub-loading">
            <span class="h-5 w-5 animate-spin rounded-full border-2 border-gray3 border-t-transparent"></span>
            {{ initialProgress && initialProgress > 1 ? "Menyiapkan halaman terakhir…" : "Membuka EPUB..." }}
          </div>
          <div ref="epubContainerRef" class="h-full w-full" data-testid="epub-container"></div>
          <div class="absolute inset-0 z-10" @pointerdown="onSwipeDown" @pointerup="onSwipeUp">
            <button class="absolute inset-y-0 left-0 w-[18%] cursor-w-resize bg-transparent disabled:cursor-default" :disabled="readerBusy" data-testid="tap-prev" aria-label="Halaman sebelumnya" @click="tapGo(-1)" />
            <button class="absolute inset-y-0 left-[18%] right-[18%] bg-transparent disabled:cursor-default" :disabled="readerBusy" data-testid="tap-center" aria-label="Tampilkan atau sembunyikan kontrol" @click="tapToggleChrome" />
            <button class="absolute inset-y-0 right-0 w-[18%] cursor-e-resize bg-transparent disabled:cursor-default" :disabled="readerBusy" data-testid="tap-next" aria-label="Halaman berikutnya" @click="tapGo(1)" />
          </div>
        </div>
      </div>

      <!-- PDF page mode -->
      <div v-else-if="mode === 'page'" class="h-full overflow-auto px-2 py-3 sm:px-4 sm:py-4" data-testid="pdf-page-scroller">
        <div v-if="pdfLoading" class="flex items-center justify-center gap-2 py-10 text-[15px] text-label2" data-testid="pdf-loading">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-gray3 border-t-transparent"></span> Merender halaman {{ currentPage }}...
        </div>
        <div class="mx-auto flex max-w-4xl justify-center" @click="onPageTap" @pointerdown="onSwipeDown" @pointerup="onSwipeUp">
          <canvas ref="canvasRef" class="max-w-full rounded-[6px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.16)]" data-testid="pdf-canvas"></canvas>
        </div>
      </div>

      <!-- PDF scroll mode -->
      <div v-else class="flex h-full flex-col">
        <p class="px-3 pt-1 text-center text-[12px] text-label2">Mode gulir — halaman aktif tersimpan otomatis</p>
        <div ref="scrollContainerRef" class="min-h-0 flex-1 space-y-4 overflow-auto px-3 py-3" data-testid="pdf-scroll">
          <div v-if="pdfLoading" class="flex items-center justify-center gap-2 py-8 text-[15px] text-label2"><span class="h-5 w-5 animate-spin rounded-full border-2 border-gray3 border-t-transparent"></span> Merender {{ totalPages }} halaman...</div>
          <div v-for="n in totalPages" :key="n" :data-page="n" class="flex flex-col items-center">
            <span class="mb-1 text-[11px] font-medium text-label2 tabular-nums">HAL {{ n }}/{{ totalPages }}</span>
            <canvas :ref="(el) => setPageCanvas(n, el)" class="max-w-full rounded-[4px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.18)]"></canvas>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom bar -->
    <footer
      data-testid="reader-bottombar"
      :inert="!chromeVisible"
      class="absolute inset-x-0 bottom-0 z-30 backdrop-blur-xl transition-[transform,opacity] duration-300 ease-out"
      :class="chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'"
      style="background: var(--ios-bar)"
    >
      <div class="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-t from-black/5 to-transparent" aria-hidden="true"></div>
      <div v-if="!loading && !error" class="mx-auto flex max-w-4xl items-center gap-2.5 px-3 py-2.5 sm:gap-3.5">
        <div ref="jumpRef" class="relative shrink-0">
          <button class="tap-expand rounded-full bg-fill px-2.5 py-1.5 text-[12px] font-semibold text-label tabular-nums active:opacity-60" data-testid="reader-page-chip" @click="toggleJump">
            {{ currentPage }}<span class="text-label2">/{{ totalPages || "?" }}</span>
          </button>
          <Transition name="pop">
            <div v-if="showJumpPopover" class="absolute bottom-11 left-0 z-40 flex origin-bottom-left items-center gap-2 rounded-[12px] border border-sep bg-card p-2 shadow-[0_12px_40px_rgba(0,0,0,0.22)]" data-testid="reader-jump">
              <input v-model="jumpInput" type="number" :min="1" :max="totalPages || undefined" class="w-16 rounded-[8px] bg-fill px-2 py-2.5 text-center text-[14px] text-label tabular-nums focus:outline-none focus:ring-2 focus:ring-blue" data-testid="reader-jump-input" @keydown.enter="jump" />
              <button class="tap-expand rounded-[8px] bg-blue px-2.5 py-2 text-[12px] font-semibold text-white active:opacity-70" data-testid="reader-jump-submit" @click="jump">Buka</button>
            </div>
          </Transition>
        </div>

        <button class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fill text-blue-text active:opacity-70 disabled:opacity-30 lg:h-9 lg:w-9" :disabled="currentPage <= 1" data-testid="reader-prev" aria-label="Sebelumnya" @click="go(-1)">
          <PhCaretLeft :size="17" weight="bold" />
        </button>

        <div class="relative h-11 flex-1" data-testid="reader-slider">
          <div class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-gray5">
            <div class="h-full w-full origin-left rounded-full bg-blue transition-transform duration-200" :style="{ transform: `scaleX(${progressPercent / 100})` }"></div>
          </div>
          <div class="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-sep/60 bg-white shadow-sm" :style="{ left: `calc(${progressPercent}% - 7px)` }"></div>
          <input type="range" :min="1" :max="totalPages || 1" :value="currentPage" class="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0" data-testid="reader-range" aria-label="Geser halaman" @input="onRangeInput" />
        </div>

        <button class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fill text-blue-text active:opacity-70 disabled:opacity-30 lg:h-9 lg:w-9" :disabled="!!totalPages && currentPage >= totalPages" data-testid="reader-next" aria-label="Berikutnya" @click="go(1)">
          <PhCaretRight :size="17" weight="bold" />
        </button>

        <span class="hidden w-16 shrink-0 text-right text-[11px] font-medium sm:block" data-testid="reader-status">
          <span v-if="saving" class="text-blue-text">menyimpan…</span>
          <span v-else class="text-label3">tersimpan</span>
        </span>
      </div>
    </footer>
  </div>
</template>
