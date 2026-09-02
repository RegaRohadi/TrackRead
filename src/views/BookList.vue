<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  PhLightning,
  PhSun,
  PhMoon,
  PhSignOut,
  PhPlus,
  PhCalendarBlank,
  PhPencilSimple,
  PhTrash,
  PhUploadSimple,
  PhBookOpen,
  PhFiles,
  PhArrowRight,
} from "@phosphor-icons/vue";
import { useBooks } from "@/composables/useBooks";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/composables/useTheme";
import ProgressBar from "@/components/ProgressBar.vue";
import ReadingStatsBar from "@/components/ReadingStatsBar.vue";
import BookLookupModal from "@/components/BookLookupModal.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import BookCard from "@/components/BookCard.vue";
import BookForm from "@/components/BookForm.vue";
import SearchBar from "@/components/SearchBar.vue";
import UploadPdfModal from "@/components/UploadPdfModal.vue";
import type { Book, ExternalBookResult } from "@/types/book";
import BookPlaceholder from "@/assets/placeholder.svg";

const storageBase = import.meta.env.VITE_STORAGE_BASE_URL || "http://localhost:8001/storage";
const coverUrl = (cover?: string | null, coverUrlProp?: string | null): string => {
  if (coverUrlProp) return coverUrlProp;
  if (!cover) return BookPlaceholder;
  if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
  return `${storageBase}/${cover}`;
};
function onCoverError(event: Event) { (event.target as HTMLImageElement).src = BookPlaceholder; }

const { theme, toggleTheme } = useTheme();
const {
  books, genres, selectedGenre, selectedStatus, selectedSource, stats, yearlyGoal, searchQuery, page, lastPage, form,
  loading, isSubmitting, showForm, isEdit, getBooks, getGenres, getStats, getContinueReading, setPage, setGenre, setStatus, setSource, setSearch, clearSearch, setYearlyGoal, submitForm, deleteBook, autofillFromExternal, uploadPdf, openCreateForm, openEditForm, closeForm, setCover, coverPreviewUrl, coverFile, isFetchingCover, isUploading, uploadProgress, continueBooks, continueLoading,
} = useBooks();

const router = useRouter();
const authStore = useAuthStore();
const showLookupModal = ref(false);
const showUploadModal = ref(false);
const featuredId = ref<number | null>(null);
const synopsisExpanded = ref(false);

const featuredBook = computed<Book | null>(() => books.value.find((b) => b.id === featuredId.value) ?? books.value[0] ?? null);
function selectFeatured(book: Book) { featuredId.value = book.id; }
function openReader(book: Book) { router.push({ name: "reader", params: { id: book.id } }); }
function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function getStatusBadge(status?: string) {
  switch (status) {
    case "currently_reading": return { label: "Sedang dibaca", text: "text-terra-700 dark:text-terra-400" };
    case "finished": return { label: "Selesai", text: "text-base-700 dark:text-base-200" };
    case "dropped": return { label: "Berhenti", text: "text-base-500 dark:text-base-400" };
    case "to_read": default: return { label: "Ingin dibaca", text: "text-base-500 dark:text-base-400" };
  }
}
async function handleLogout() { await authStore.logout(); await router.push({ name: "auth" }); }
async function handleLookupSelect(externalBook: ExternalBookResult) {
  if (!showForm.value) openCreateForm();
  await autofillFromExternal(externalBook);
}
async function handleUpload(payload: { file: File; meta: { name: string; author: string; genre: string } }) {
  const created = await uploadPdf(payload.file, payload.meta);
  if (created) showUploadModal.value = false;
}
watch(books, (newBooks) => { if (!newBooks.some((b) => b.id === featuredId.value)) featuredId.value = newBooks[0]?.id ?? null; });
watch(() => featuredBook.value?.id, () => { synopsisExpanded.value = false; });
const visiblePages = computed(() => {
  const maxVisible = 5;
  let start = Math.max(1, page.value - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > lastPage.value) { end = lastPage.value; start = Math.max(1, end - maxVisible + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
onMounted(() => { getGenres(); getStats(); getBooks(); getContinueReading(); });
</script>

<template>
  <div class="min-h-screen bg-base-50 transition-colors dark:bg-base-950">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header class="mb-10 flex flex-col gap-5 border-b border-base-200 pb-6 sm:pb-8 dark:border-base-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="mb-1 text-[11px] font-medium tracking-[0.2em] text-terra-700 uppercase dark:text-terra-400">Katalog PDF</p>
          <h1 class="text-4xl font-semibold tracking-tight text-base-900 sm:text-5xl dark:text-base-50">TrackRead</h1>
          <p class="mt-2 max-w-md text-sm leading-relaxed text-base-500 dark:text-base-400">
            Baca di browser, progres tersimpan otomatis — <span class="text-base-700 dark:text-base-200">{{ authStore.user?.name || "Pembaca" }}</span>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button @click="toggleTheme" class="inline-flex h-9 w-9 items-center justify-center border border-base-300 bg-white text-base-600 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-300" :aria-label="theme === 'dark' ? 'Mode terang' : 'Mode gelap'"><PhMoon v-if="theme === 'dark'" :size="16" weight="duotone" /><PhSun v-else :size="16" weight="duotone" /></button>
          <BaseButton @click="showUploadModal = true"><PhUploadSimple :size="16" weight="bold" /> Upload PDF</BaseButton>
          <BaseButton variant="secondary" @click="openCreateForm"><PhPlus :size="16" weight="bold" /> Tambah Manual</BaseButton>
          <button class="inline-flex items-center gap-1.5 border border-base-300 bg-white px-3 py-1.5 text-xs font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200" @click="handleLogout"><PhSignOut :size="14" weight="bold" /> Logout</button>
        </div>
      </header>

      <ReadingStatsBar :stats="stats" :yearly-goal="yearlyGoal" @update-goal="setYearlyGoal" />

      <section v-if="continueBooks.length > 0 || continueLoading" class="mb-8">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-sm font-semibold tracking-wide text-base-800 uppercase dark:text-base-200"><PhBookOpen :size="16" weight="duotone" class="text-terra-600" /> Lagi Dibaca</h2>
          <span class="text-xs text-base-400">{{ continueBooks.length }} buku</span>
        </div>
        <div v-if="continueLoading" class="flex gap-3 overflow-hidden"><div v-for="i in 3" :key="i" class="h-36 w-48 shrink-0 animate-pulse bg-base-100 dark:bg-base-800"></div></div>
        <div v-else class="flex gap-3 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button v-for="b in continueBooks" :key="b.id" @click="openReader(b)" class="group flex w-64 shrink-0 snap-start items-center gap-3 border border-base-200 bg-white p-3 text-left transition-colors hover:border-terra-300 dark:border-base-800 dark:bg-base-900">
            <img :src="coverUrl(b.cover, b.cover_url)" :alt="b.name" class="h-20 w-14 shrink-0 object-cover" @error="onCoverError" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-base-900 dark:text-base-100">{{ b.name }}</p>
              <p class="truncate text-xs text-base-500">{{ b.author || "—" }}</p>
              <div class="mt-2 h-1 overflow-hidden rounded-full bg-base-100 dark:bg-base-800"><div class="h-full bg-terra-600" :style="{ width: (b.progress_percent ?? 0) + '%' }"></div></div>
              <p class="mt-1 text-[11px] text-base-400">{{ b.progress_percent ?? 0 }}% • hal {{ b.current_page ?? 0 }}/{{ b.pdf_total_pages ?? b.pages ?? "?" }} — Lanjut <PhArrowRight :size="10" class="inline" /></p>
            </div>
          </button>
        </div>
      </section>

      <div class="mb-8 border border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
        <div class="flex flex-wrap items-center gap-1 border-b border-base-200 px-2 py-2 dark:border-base-800">
          <button @click="setSource('')" class="px-3 py-1.5 text-xs font-medium" :class="selectedSource === '' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300'">Semua · {{ stats?.total_books ?? 0 }}</button>
          <button @click="setSource('platform')" class="px-3 py-1.5 text-xs font-medium" :class="selectedSource === 'platform' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400'">Koleksi Platform</button>
          <button @click="setSource('upload')" class="px-3 py-1.5 text-xs font-medium" :class="selectedSource === 'upload' ? 'bg-terra-700 text-white' : 'text-terra-700 hover:bg-terra-50 dark:text-terra-400'">Upload Saya</button>
          <span class="mx-1 h-4 w-px bg-base-200 dark:bg-base-800"></span>
          <button @click="setStatus('')" class="px-2.5 py-1.5 text-xs font-medium" :class="selectedStatus === '' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300'">Semua status</button>
          <button @click="setStatus('currently_reading')" class="px-2.5 py-1.5 text-xs font-medium" :class="selectedStatus === 'currently_reading' ? 'bg-terra-700 text-white' : 'text-terra-700 hover:bg-terra-50 dark:text-terra-400'">Sedang dibaca</button>
          <button @click="setStatus('finished')" class="px-2.5 py-1.5 text-xs font-medium" :class="selectedStatus === 'finished' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300'">Selesai</button>
          <button @click="setStatus('to_read')" class="px-2.5 py-1.5 text-xs font-medium" :class="selectedStatus === 'to_read' ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300'">Ingin dibaca</button>
        </div>
        <div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar placeholder="Cari judul, penulis, atau genre..." @search="setSearch" @clear="clearSearch" />
          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2"><span class="text-xs font-medium text-base-500">Genre</span>
              <select v-model="selectedGenre" @change="setGenre(selectedGenre)" class="rounded-[0.25rem] border border-base-300 bg-white px-2.5 py-1.5 text-xs font-medium text-base-700 focus:border-terra-600 focus:outline-none dark:border-base-700 dark:bg-base-900 dark:text-base-200">
                <option value="">Semua</option><option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
              </select>
            </label>
            <div v-if="lastPage > 1" class="flex items-center border border-base-300">
              <button :disabled="page <= 1" @click="setPage(1)" class="px-2.5 py-1.5 text-xs text-base-600 hover:bg-base-100 disabled:opacity-30">«</button>
              <button :disabled="page <= 1" @click="setPage(page - 1)" class="px-2.5 py-1.5 text-xs text-base-600 hover:bg-base-100 disabled:opacity-30">‹</button>
              <button v-for="n in visiblePages" :key="n" @click="setPage(n)" class="h-8 w-8 text-xs font-medium" :class="n === page ? 'bg-terra-700 text-white' : 'text-base-700 hover:bg-base-100 dark:text-base-200'">{{ n }}</button>
              <button :disabled="page >= lastPage" @click="setPage(page + 1)" class="px-2.5 py-1.5 text-xs text-base-600 hover:bg-base-100 disabled:opacity-30">›</button>
              <button :disabled="page >= lastPage" @click="setPage(lastPage)" class="px-2.5 py-1.5 text-xs text-base-600 hover:bg-base-100 disabled:opacity-30">»</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="py-16 text-center text-base-400">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-terra-600 border-t-transparent"></div>
        <p class="mt-3 text-sm">Memuat koleksi...</p>
      </div>

      <div v-else-if="books.length === 0" class="border border-base-200 bg-white p-12 text-center dark:border-base-800 dark:bg-base-900">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-base-100 dark:bg-base-800"><PhFiles :size="24" weight="duotone" class="text-base-400" /></div>
        <h3 class="mt-4 font-display text-xl font-semibold text-base-900 dark:text-base-100">
          <span v-if="selectedSource === 'upload'">Belum ada PDF upload</span>
          <span v-else-if="selectedSource === 'platform'">Tidak ada koleksi platform</span>
          <span v-else>Tidak ada buku ditemukan</span>
        </h3>
        <p class="mx-auto mt-2 max-w-sm text-sm text-base-500 dark:text-base-400">
          <span v-if="selectedSource === 'upload'">Upload PDF pribadimu — hanya kamu yang bisa melihat & membacanya (maks 50MB, privat).</span>
          <span v-else-if="selectedSource === 'platform'">Koleksi platform belum tersedia. Jalankan seeder atau hubungi admin.</span>
          <span v-else>{{ selectedStatus || selectedGenre || searchQuery ? "Coba ubah filter atau kata kunci." : "Koleksi kosong. Upload PDF atau tambah manual." }}</span>
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <BaseButton v-if="selectedSource === 'upload' || selectedSource === ''" @click="showUploadModal = true"><PhUploadSimple :size="14" weight="bold" /> Upload PDF Pertama</BaseButton>
          <button v-if="selectedSource !== 'platform'" @click="showLookupModal = true" class="inline-flex items-center gap-1.5 border border-base-300 bg-white px-3.5 py-1.5 text-xs font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200"><PhLightning :size="14" weight="fill" class="text-terra-600" /> Cari via Google Books</button>
          <BaseButton v-if="selectedSource === ''" variant="secondary" @click="openCreateForm"><PhPlus :size="14" weight="bold" /> Tambah Manual</BaseButton>
          <BaseButton v-if="selectedSource !== ''" variant="secondary" @click="setSource(''); setStatus(''); clearSearch()">Lihat Semua</BaseButton>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Transition mode="out-in" enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
          <div v-if="featuredBook" :key="featuredBook.id" class="border border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
            <div class="relative w-full bg-base-100 dark:bg-base-800">
              <img :src="coverUrl(featuredBook.cover, featuredBook.cover_url)" :alt="featuredBook.name" class="max-h-80 w-full object-cover" referrerpolicy="no-referrer" loading="lazy" @error="onCoverError" />
              <span v-if="featuredBook.source === 'platform'" class="absolute left-3 top-3 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">PLATFORM • storage/app/private/platform_books/</span>
              <span v-else class="absolute left-3 top-3 rounded bg-terra-700 px-2 py-0.5 text-[10px] font-bold text-white">PRIVAT</span>
            </div>
            <div class="p-5">
              <span class="mb-3 inline-block text-[11px] font-medium tracking-wide uppercase" :class="getStatusBadge(featuredBook.status).text">{{ getStatusBadge(featuredBook.status).label }} · {{ featuredBook.genre || "Tanpa genre" }}</span>
              <h2 class="font-display text-2xl font-semibold leading-tight text-base-900 dark:text-base-100">{{ featuredBook.name }}</h2>
              <p class="mt-1 text-sm text-base-500 dark:text-base-400">{{ featuredBook.author || "Penulis Anonim" }}</p>
              <div v-if="(featuredBook.pdf_total_pages ?? featuredBook.pages ?? 0) > 0" class="mt-5">
                <div class="mb-1.5 flex justify-between text-xs text-base-500 dark:text-base-400"><span>Progres</span><span>{{ featuredBook.current_page ?? featuredBook.pages_read ?? 0 }} / {{ featuredBook.pdf_total_pages ?? featuredBook.pages }} hal · {{ featuredBook.progress_percent ?? 0 }}%</span></div>
                <ProgressBar :total="featuredBook.pdf_total_pages ?? featuredBook.pages ?? 0" :value="featuredBook.current_page ?? featuredBook.pages_read ?? 0" :show-label="false" color="terra" />
              </div>
              <div v-if="featuredBook.description" class="mt-4">
                <p class="text-sm leading-relaxed text-base-600 dark:text-base-400" :class="!synopsisExpanded ? 'line-clamp-3' : ''">{{ featuredBook.description }}</p>
                <button v-if="featuredBook.description.length > 120" class="mt-1 text-xs font-medium text-terra-600 hover:text-terra-700" @click="synopsisExpanded = !synopsisExpanded">{{ synopsisExpanded ? "Tutup" : "Lihat selengkapnya" }}</button>
              </div>
              <dl class="mt-5 space-y-1.5 border-t border-base-200 pt-4 text-xs text-base-600 dark:border-base-800 dark:text-base-400">
                <div v-if="featuredBook.publisher" class="flex justify-between gap-2"><dt class="text-base-400">Penerbit</dt><dd class="truncate text-right font-medium text-base-700 dark:text-base-200">{{ featuredBook.publisher }}</dd></div>
                <div v-if="featuredBook.release_date" class="flex items-center justify-between gap-2"><dt class="text-base-400">Rilis</dt><dd class="flex items-center gap-1 truncate font-medium text-base-700 dark:text-base-200"><PhCalendarBlank :size="12" /> {{ formatDate(featuredBook.release_date) }}</dd></div>
                <div v-if="featuredBook.pdf_original_name" class="flex justify-between gap-2"><dt class="text-base-400">File</dt><dd class="truncate font-mono text-[11px] text-base-700 dark:text-base-200">{{ featuredBook.pdf_original_name }} · {{ featuredBook.pdf_total_pages }} hal</dd></div>
              </dl>
              <div class="mt-6 flex flex-wrap gap-2 border-t border-base-200 pt-4 dark:border-base-800">
                <button v-if="featuredBook.has_pdf" class="flex-1 inline-flex items-center justify-center gap-1 bg-terra-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-terra-800" @click="openReader(featuredBook)"><PhBookOpen :size="14" weight="bold" /> Baca PDF</button>
                <button class="inline-flex items-center justify-center gap-1 border border-base-300 bg-white px-3 py-1.5 text-xs font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200" @click="openEditForm(featuredBook)"><PhPencilSimple :size="14" weight="bold" /> Edit</button>
                <button v-if="featuredBook.source === 'upload'" class="inline-flex items-center justify-center gap-1 border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-base-900 dark:text-red-400" @click="deleteBook(featuredBook.id)"><PhTrash :size="14" weight="bold" /> Hapus</button>
                <span v-else class="inline-flex items-center px-2 py-1 text-[11px] text-base-400">Koleksi platform tidak bisa dihapus</span>
              </div>
            </div>
          </div>
        </Transition>
        <div v-if="books.length > 0" class="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <div v-for="book in books" :key="book.id" class="relative h-full">
            <button class="h-full w-full text-left focus:outline-none" @click="selectFeatured(book)"><BookCard :book="book" /></button>
            <button v-if="book.has_pdf" @click.stop="openReader(book)" class="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-terra-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-terra-800">Baca</button>
          </div>
        </div>
        <div v-else class="flex items-center justify-center border border-dashed border-base-300 p-10 text-sm text-base-400">Pilih atau tambah buku lainnya</div>
      </div>
    </div>

    <BaseModal :show="showForm" @close="closeForm">
      <BookForm :form="form" :is-edit="isEdit" :is-submitting="isSubmitting" :coverPreviewUrl="coverPreviewUrl" :coverFile="coverFile" :isFetchingCover="isFetchingCover" @submit="submitForm" @cancel="closeForm" @open-lookup="showLookupModal = true" @cover-change="setCover" />
    </BaseModal>
    <BookLookupModal :show="showLookupModal" @close="showLookupModal = false" @select="handleLookupSelect" />
    <UploadPdfModal :show="showUploadModal" :uploading="isUploading" :progress="uploadProgress" @close="showUploadModal = false" @upload="handleUpload" />
  </div>
</template>
