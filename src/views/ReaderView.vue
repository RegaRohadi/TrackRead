<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PhArrowLeft, PhMagnifyingGlassPlus, PhMagnifyingGlassMinus, PhArrowsOut, PhCaretLeft, PhCaretRight, PhBookOpen, PhList, PhCards } from "@phosphor-icons/vue";
import BookService from "@/services/bookservice";
import type { Book } from "@/types/book";
import api from "@/services/api";

(pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = workerUrl;

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const book = ref<Book | null>(null);
const loading = ref(true);
const pdfLoading = ref(false);
const error = ref("");
const totalPages = ref(0);
const currentPage = ref(1);
const scale = ref(1.15);
const saving = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const scrollContainerRef = ref<HTMLDivElement | null>(null);
let pdfDoc: pdfjs.PDFDocumentProxy | null = null;
let renderTask: pdfjs.RenderTask | null = null;
const pdfBlobUrl = ref<string | null>(null);
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const mode = ref<"page" | "scroll">((localStorage.getItem("trackread_reader_mode") as "page" | "scroll") || "page");
const pageCanvasMap = new Map<number, HTMLCanvasElement>();
let observer: IntersectionObserver | null = null;
let renderAllAbort = false;

const progressPercent = computed(() => totalPages.value ? Math.min(100, Math.round((currentPage.value / totalPages.value) * 1000) / 10) : 0);
const jumpInput = ref("1");

function setMode(m: "page" | "scroll") {
  if (mode.value === m) return;
  mode.value = m;
  localStorage.setItem("trackread_reader_mode", m);
}

watch(mode, async (m) => {
  if (!pdfDoc || loading.value || error.value) return;
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
  if (!pdfDoc) return;
  if (mode.value === "scroll") await renderAllPages();
  else await renderPage(currentPage.value);
});

function setPageCanvas(n: number, el: unknown) {
  const c = el as HTMLCanvasElement | null;
  if (c) pageCanvasMap.set(n, c);
  else pageCanvasMap.delete(n);
}

function debouncedSave(page: number) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saving.value = true;
    try { await BookService.saveProgress(id.value, page); } catch (e) { console.error("saveProgress failed", e); }
    saving.value = false;
  }, 500);
}

async function flushSave() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  saving.value = true;
  try { await BookService.saveProgress(id.value, currentPage.value); } catch (e) { console.error("flushSave failed", e); }
  saving.value = false;
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
  }
}

async function fetchPdfBlob() {
  const base = (api.defaults.baseURL as string) || "";
  const url = `${base.replace(/\/$/, "")}/books/${id.value}/file`;
  const res = await api.get(url, { responseType: "blob" });
  const blob = res.data as Blob;
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);
  pdfBlobUrl.value = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  return pdfBlobUrl.value;
}

async function loadPdf() {
  if (!pdfBlobUrl.value) return;
  pdfLoading.value = true;
  try {
    const doc = await pdfjs.getDocument({ url: pdfBlobUrl.value, cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/cmaps/", cMapPacked: true }).promise;
    pdfDoc = doc;
    totalPages.value = doc.numPages;
    if (book.value && !book.value.pdf_total_pages) book.value.pdf_total_pages = doc.numPages;
    try {
      const prog = await BookService.getProgress(id.value);
      if (prog.current_page >= 1 && prog.current_page <= doc.numPages) {
        currentPage.value = prog.current_page;
        jumpInput.value = String(prog.current_page);
      }
    } catch {}
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

function go(delta: number) {
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
  const n = Number(jumpInput.value);
  if (!Number.isFinite(n) || n < 1 || (totalPages.value && n > totalPages.value)) { jumpInput.value = String(currentPage.value); return; }
  currentPage.value = n;
  if (mode.value === "scroll") { scrollToPage(n, true); debouncedSave(n); }
  else { renderPage(n); debouncedSave(n); }
}

function onSliderInput() {
  jumpInput.value = String(currentPage.value);
  if (mode.value === "scroll") { scrollToPage(currentPage.value, true); debouncedSave(currentPage.value); }
  else { renderPage(currentPage.value); debouncedSave(currentPage.value); }
}

function zoom(delta: number) {
  scale.value = Math.min(2.5, Math.max(0.6, scale.value + delta));
}

function toggleFullscreen() {
  const el = containerRef.value;
  if (!el) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else el.requestFullscreen();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
  if (e.key === "+" || e.key === "=") zoom(0.15);
  if (e.key === "-") zoom(-0.15);
}

onMounted(async () => {
  loading.value = true;
  await fetchBook();
  if (error.value) { loading.value = false; return; }
  if (!book.value?.has_pdf) {
    error.value = "Buku ini belum memiliki file PDF.";
    loading.value = false;
    return;
  }
  try {
    await fetchPdfBlob();
  } catch {
    error.value = "Gagal memuat file PDF. Pastikan file masih ada di storage/app/private.";
    loading.value = false;
    return;
  }
  loading.value = false;
  await nextTick();
  await loadPdf();
  window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  teardownObserver();
  renderAllAbort = true;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);
  if (pdfDoc) { try { pdfDoc.destroy(); } catch {} }
});

async function back() {
  await flushSave();
  router.push({ name: "books" });
}
</script>

<template>
  <div ref="containerRef" class="min-h-screen bg-base-50 dark:bg-base-950">
    <div class="sticky top-0 z-20 border-b border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
      <div class="h-1 w-full bg-base-100 dark:bg-base-800"><div class="h-full bg-terra-600 transition-all duration-300" :style="{ width: progressPercent + '%' }"></div></div>
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 sm:px-8">
        <button class="inline-flex items-center gap-1.5 rounded border border-base-300 bg-white px-2.5 py-1.5 text-xs font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200" @click="back"><PhArrowLeft :size="14" weight="bold" /> Kembali</button>
        <div class="min-w-0 flex-1 truncate text-sm font-medium text-base-800 dark:text-base-100">{{ book?.name || "Reader" }}<span v-if="saving" class="ml-2 text-[11px] font-normal text-terra-600">menyimpan...</span></div>
        <div class="hidden items-center gap-1 text-xs text-base-500 sm:flex">Hal {{ currentPage }} / {{ totalPages || "?" }} • {{ progressPercent }}%</div>
        <div class="flex items-center overflow-hidden rounded border border-base-300 text-xs font-medium">
          <button class="inline-flex items-center gap-1 px-2.5 py-1.5" :class="mode === 'page' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'bg-white text-base-600 hover:bg-base-50 dark:bg-base-900 dark:text-base-300'" @click="setMode('page')" title="Mode halaman (Next/Prev)"><PhCards :size="14" weight="bold" /> Halaman</button>
          <button class="inline-flex items-center gap-1 border-l border-base-300 px-2.5 py-1.5" :class="mode === 'scroll' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'bg-white text-base-600 hover:bg-base-50 dark:bg-base-900 dark:text-base-300'" @click="setMode('scroll')" title="Mode gulir (scroll semua halaman)"><PhList :size="14" weight="bold" /> Gulir</button>
        </div>
        <div class="flex items-center gap-1">
          <button class="inline-flex h-7 w-7 items-center justify-center border border-base-300 bg-white hover:bg-base-100 dark:border-base-700 dark:bg-base-900" @click="zoom(-0.15)" title="Zoom out"><PhMagnifyingGlassMinus :size="14" /></button>
          <span class="w-10 text-center text-xs font-medium text-base-600 dark:text-base-300">{{ Math.round(scale * 100) }}%</span>
          <button class="inline-flex h-7 w-7 items-center justify-center border border-base-300 bg-white hover:bg-base-100 dark:border-base-700 dark:bg-base-900" @click="zoom(0.15)" title="Zoom in"><PhMagnifyingGlassPlus :size="14" /></button>
          <button class="ml-1 inline-flex h-7 w-7 items-center justify-center border border-base-300 bg-white hover:bg-base-100 dark:border-base-700 dark:bg-base-900" @click="toggleFullscreen" title="Fullscreen"><PhArrowsOut :size="14" /></button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mx-auto max-w-6xl px-4 py-16 text-center text-base-400 sm:px-8">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-terra-600 border-t-transparent"></div>
      <p class="mt-3 text-sm">Memuat PDF...</p>
    </div>

    <div v-else-if="error" class="mx-auto max-w-6xl px-4 py-16 text-center sm:px-8">
      <div class="mx-auto max-w-md rounded border border-amber-200 bg-amber-50 px-6 py-8 dark:border-amber-900 dark:bg-amber-950">
        <PhBookOpen :size="32" weight="duotone" class="mx-auto text-amber-600" />
        <p class="mt-3 text-sm font-medium text-amber-900 dark:text-amber-100">{{ error }}</p>
        <button class="mt-4 inline-flex items-center gap-1.5 rounded bg-base-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-base-100 dark:text-base-900" @click="back">Kembali ke Library</button>
      </div>
    </div>

    <div v-else-if="mode === 'page'" class="mx-auto max-w-4xl px-2 py-4 sm:px-8">
      <div v-if="pdfLoading" class="flex justify-center py-12 text-sm text-base-400"><span class="h-6 w-6 animate-spin rounded-full border-2 border-terra-600 border-t-transparent"></span><span class="ml-2">Merender halaman {{ currentPage }}...</span></div>
      <div class="flex justify-center overflow-auto bg-white p-2 shadow-sm dark:bg-base-900 sm:p-4">
        <canvas ref="canvasRef" class="max-w-full shadow"></canvas>
      </div>
    </div>

    <div v-else class="mx-auto flex max-w-4xl flex-col px-2 py-2 sm:px-8">
      <p class="mb-2 text-center text-[11px] text-base-400">Mode gulir — scroll untuk baca, halaman aktif otomatis tersimpan</p>
      <div ref="scrollContainerRef" class="h-[calc(100vh-160px)] space-y-4 overflow-auto rounded border border-base-200 bg-base-100 p-3 dark:border-base-800 dark:bg-base-900">
        <div v-if="pdfLoading" class="flex justify-center py-8 text-sm text-base-400"><span class="h-6 w-6 animate-spin rounded-full border-2 border-terra-600 border-t-transparent"></span><span class="ml-2">Merender {{ totalPages }} halaman...</span></div>
        <div v-for="n in totalPages" :key="n" :data-page="n" class="flex flex-col items-center">
          <span class="mb-1 text-[10px] font-medium tracking-wide text-base-400">HAL {{ n }}/{{ totalPages }}</span>
          <canvas :ref="(el) => setPageCanvas(n, el)" class="max-w-full bg-white shadow dark:bg-base-900"></canvas>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error" class="sticky bottom-0 z-20 border-t border-base-200 bg-white px-4 py-2 dark:border-base-800 dark:bg-base-900 sm:px-8">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <button class="inline-flex items-center gap-1 rounded border border-base-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-base-100 disabled:opacity-40 dark:border-base-700 dark:bg-base-900 dark:hover:bg-base-800" :disabled="currentPage <= 1" @click="go(-1)"><PhCaretLeft :size="14" weight="bold" /> Prev</button>
        <div class="flex items-center gap-2">
          <input v-model="jumpInput" @keydown.enter="jump" @blur="jump" type="number" :min="1" :max="totalPages || undefined" class="w-16 rounded border border-base-300 bg-white px-2 py-1 text-center text-xs dark:border-base-700 dark:bg-base-900" />
          <span class="text-xs text-base-500">/ {{ totalPages || "?" }}</span>
          <input type="range" :min="1" :max="totalPages || 1" :value="currentPage" @input="currentPage = Number(($event.target as HTMLInputElement).value); onSliderInput()" class="hidden h-1 w-24 accent-terra-600 sm:block" />
          <span class="hidden text-[11px] text-base-400 sm:inline">{{ mode === 'scroll' ? 'Gulir' : 'Halaman' }}</span>
        </div>
        <button class="inline-flex items-center gap-1 rounded border border-base-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-base-100 disabled:opacity-40 dark:border-base-700 dark:bg-base-900 dark:hover:bg-base-800" :disabled="!!totalPages && currentPage >= totalPages" @click="go(1)">Next <PhCaretRight :size="14" weight="bold" /></button>
      </div>
      <p class="mt-1 text-center text-[11px] text-base-400">← → pindah halaman • +/- zoom • auto-save 500ms • Toggle Halaman/Gulir di atas</p>
    </div>
  </div>
</template>
