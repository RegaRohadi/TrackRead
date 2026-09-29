<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  PhBooks,
  PhBookmarkSimple,
  PhBookOpen,
  PhCheck,
  PhCheckCircle,
  PhArchiveBox,
  PhTag,
  PhArrowsDownUp,
  PhPlus,
  PhUploadSimple,
  PhSignOut,
  PhPencilSimple,
  PhTrash,
  PhClock,
  PhX,
  PhCaretRight,
  PhHeart,
  PhFlask,
  PhBriefcase,
  PhGlobe,
  PhGraduationCap,
  PhPalette,
  PhMusicNotes,
  PhCode,
  PhDetective,
  PhSparkle,
  PhScales,
  PhNewspaper,
} from "@phosphor-icons/vue";
import { useBooks } from "@/composables/useBooks";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/composables/useTheme";
import BookService from "@/services/bookservice";
import AppNav from "@/components/ios/AppNav.vue";
import IOSNavBar from "@/components/ios/IOSNavBar.vue";
import IOSListGroup from "@/components/ios/IOSListGroup.vue";
import IOSListRow from "@/components/ios/IOSListRow.vue";
import SegmentedControl from "@/components/ios/SegmentedControl.vue";
import ContinueCard from "@/components/ContinueCard.vue";
import BookCard from "@/components/BookCard.vue";
import StatusSelect from "@/components/StatusSelect.vue";
import CoverImage from "@/components/ios/CoverImage.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import SearchBar from "@/components/SearchBar.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import BookForm from "@/components/BookForm.vue";
import BookLookupModal from "@/components/BookLookupModal.vue";
import UploadBookModal from "@/components/UploadBookModal.vue";
import type { Book, ExternalBookResult, ReadingStatus } from "@/types/book";

const { preference, setTheme } = useTheme();
const router = useRouter();
const authStore = useAuthStore();

const {
  books, genres, selectedGenre, selectedStatus, selectedSource, sort, stats, yearlyGoal, page, lastPage, total, form,
  loading, isSubmitting, showForm, isEdit, getBooks, loadMore, getGenres, getStats, getContinueReading, setGenre, setStatus, setSource, setSort, setSearch, clearSearch, setYearlyGoal, submitForm, updateStatus, deleteBook, autofillFromExternal, uploadBook, openCreateForm, openEditForm, closeForm, setCover, coverPreviewUrl, coverFile, isFetchingCover, isUploading, uploadProgress, continueBooks, continueLoading,
} = useBooks();

const activeTab = ref<"buku" | "katalog" | "profil">("buku");
const selectedBook = ref<Book | null>(null);
const discoverBooks = ref<Book[]>([]);
const showLookupModal = ref(false);
const showUploadModal = ref(false);
const synopsisExpanded = ref(false);
const goalEditing = ref(false);
const goalInput = ref(yearlyGoal.value);

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "title", label: "Judul" },
  { value: "author", label: "Penulis" },
];
const sortOpen = ref(false);

const sourceOptions = [
  { value: "", label: "Semua" },
  { value: "platform", label: "Platform" },
  { value: "upload", label: "Saya" },
];

const statusRows = computed(() => {
  const b = stats.value?.status_breakdown;
  return [
    { key: "", label: "Semua Buku", icon: PhBooks, color: "text-blue-text", count: stats.value?.total_books ?? 0 },
    { key: "to_read", label: "Ingin Dibaca", icon: PhBookmarkSimple, color: "text-blue-text", count: b?.to_read ?? 0 },
    { key: "currently_reading", label: "Sedang Dibaca", icon: PhBookOpen, color: "text-orange-text", count: b?.currently_reading ?? 0 },
    { key: "finished", label: "Selesai", icon: PhCheckCircle, color: "text-green-text", count: b?.finished ?? 0 },
    { key: "dropped", label: "Berhenti", icon: PhArchiveBox, color: "text-gray", count: b?.dropped ?? 0 },
  ];
});

const hasMore = computed(() => page.value < lastPage.value);
const activeSortLabel = computed(() => sortOptions.find((o) => o.value === sort.value)?.label ?? "Terbaru");
const goalPercent = computed(() => {
  const goal = yearlyGoal.value;
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round(((stats.value?.status_breakdown?.finished ?? 0) / goal) * 100));
});

function openDetail(book: Book) {
  selectedBook.value = book;
  synopsisExpanded.value = false;
}
async function changeStatus(status: ReadingStatus) {
  if (!selectedBook.value) return;
  const updated = await updateStatus(selectedBook.value, status);
  if (updated && selectedBook.value) selectedBook.value = { ...selectedBook.value, status };
}
function openReader(book: Book) {
  selectedBook.value = null;
  router.push({ name: "reader", params: { id: book.id } });
}
function openStatus(status: string) {
  setStatus(status);
  activeTab.value = "katalog";
}
function openGenre(genre: string) {
  setGenre(genre);
  activeTab.value = "katalog";
}
function openAllBooks() {
  selectedStatus.value = "";
  selectedSource.value = "";
  setGenre("");
  activeTab.value = "katalog";
}
function getGenreIcon(genre: string) {
  const value = genre.toLowerCase();
  if (/(romance|romantis|romansa|cinta|love)/.test(value)) return PhHeart;
  if (/(science|sains|ilmiah|flask|medis|kesehatan|health)/.test(value)) return PhFlask;
  if (/(programming|pemrograman|coding|komputer|software|developer)/.test(value)) return PhCode;
  if (/(bisnis|business|ekonomi|finance|keuangan|karier|career)/.test(value)) return PhBriefcase;
  if (/(pendidikan|education|akademik|academic|sekolah|kuliah)/.test(value)) return PhGraduationCap;
  if (/(travel|wisata|perjalanan|geografi|geography)/.test(value)) return PhGlobe;
  if (/(seni|art|desain|design|arsitektur|architecture)/.test(value)) return PhPalette;
  if (/(musik|music|lagu|song)/.test(value)) return PhMusicNotes;
  if (/(misteri|mystery|detektif|detective|kriminal|crime|thriller)/.test(value)) return PhDetective;
  if (/(sejarah|history|masa lalu)/.test(value)) return PhClock;
  if (/(filsafat|philosophy|etika|ethics)/.test(value)) return PhScales;
  if (/(berita|news|jurnalistik|journalism)/.test(value)) return PhNewspaper;
  if (/(pengembangan diri|self[- ]help|motivasi|motivation|inspirasi|inspiration)/.test(value)) return PhSparkle;
  if (/(novel|fiksi|fiction|cerita|story)/.test(value)) return PhBookOpen;
  if (/(biografi|memoar|memoir)/.test(value)) return PhBookmarkSimple;
  return PhTag;
}
const genreThemes = [
  { bar: "bg-blue", icon: "bg-blue text-white" },
  { bar: "bg-orange", icon: "bg-orange text-white" },
  { bar: "bg-green", icon: "bg-green text-white" },
  { bar: "bg-red", icon: "bg-red text-white" },
  { bar: "bg-gray", icon: "bg-gray text-white" },
];
function getGenreTheme(index: number) {
  return genreThemes[index % genreThemes.length] ?? { bar: "bg-blue", icon: "bg-blue text-white" };
}
function openPlatform() {
  setSource("platform");
  activeTab.value = "katalog";
}
function chooseSort(value: string) {
  setSort(value as "newest" | "oldest" | "title" | "author");
  sortOpen.value = false;
}
function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function saveGoal() {
  if (goalInput.value > 0) {
    setYearlyGoal(goalInput.value);
    goalEditing.value = false;
  }
}
function cancelGoal() {
  goalInput.value = yearlyGoal.value;
  goalEditing.value = false;
}
async function handleLogout() {
  await authStore.logout();
  await router.push({ name: "auth" });
}
async function handleLookupSelect(externalBook: ExternalBookResult) {
  if (!showForm.value) openCreateForm();
  await autofillFromExternal(externalBook);
}
async function handleUpload(payload: { file: File; meta: { name: string; author: string; genre: string } }) {
  const created = await uploadBook(payload.file, payload.meta);
  if (created) showUploadModal.value = false;
}
function editFromDetail(book: Book) {
  selectedBook.value = null;
  openEditForm(book);
}
async function deleteFromDetail(book: Book) {
  selectedBook.value = null;
  await deleteBook(book.id);
}
function readSelected() {
  if (selectedBook.value) openReader(selectedBook.value);
}
function readLabel(book: Book | null) {
  if (!book) return "Baca";
  if ((book.current_page ?? 0) > 0) return "Lanjutkan Baca";
  return book.file_type === "epub" ? "Baca EPUB" : "Baca PDF";
}
function editSelected() {
  if (selectedBook.value) editFromDetail(selectedBook.value);
}
function deleteSelected() {
  if (selectedBook.value) void deleteFromDetail(selectedBook.value);
}
async function loadDiscover() {
  try {
    const res = await BookService.getAll({ source: "platform", per_page: 10, sort: "title" });
    discoverBooks.value = res.data;
  } catch {
    discoverBooks.value = [];
  }
}
watch(selectedBook, () => { synopsisExpanded.value = false; });
onMounted(() => {
  getGenres();
  getStats();
  getBooks();
  getContinueReading();
  loadDiscover();
});
</script>

<template>
  <div class="min-h-screen bg-grouped">
    <AppNav :active="activeTab" @select="activeTab = $event">
      <template #actions>
        <template v-if="activeTab === 'buku'">
          <button class="grid h-11 w-11 place-items-center rounded-full text-blue-text active:opacity-60 lg:h-9 lg:w-9" aria-label="Unggah PDF/EPUB" @click="showUploadModal = true">
            <PhUploadSimple :size="19" weight="bold" />
          </button>
        </template>
        <button v-if="activeTab !== 'profil'" class="grid h-11 w-11 place-items-center lg:h-9 lg:w-9 rounded-full text-blue-text active:opacity-60" aria-label="Tambah buku" @click="openCreateForm">
          <PhPlus :size="19" weight="bold" />
        </button>
      </template>
    </AppNav>

    <main class="mx-auto w-full max-w-[1600px] pb-28 lg:pb-12">
      <!-- ============ BUKU ============ -->
      <template v-if="activeTab === 'buku'">
        <IOSNavBar large-title="Buku" />

        <div class="space-y-7 px-4 pt-3 lg:px-8">
            <!-- Discover shelf -->
            <section v-if="discoverBooks.length">
              <div class="mb-2 flex items-baseline justify-between">
                <h2 class="text-[20px] font-bold tracking-[-0.01em] text-label">Koleksi Klasik</h2>
                <button class="tap-expand text-[15px] font-semibold text-blue-text active:opacity-60" @click="openPlatform">Lihat semua</button>
              </div>
              <div class="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
                <button v-for="book in discoverBooks" :key="book.id" class="group w-[92px] shrink-0 text-left transition-transform active:scale-[0.97]" @click="openDetail(book)">
                  <div class="aspect-[2/3] w-full origin-left overflow-hidden rounded-[8px] bg-gray6 shadow-[0_1px_3px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out will-change-transform group-hover:[transform:perspective(900px)_translateY(-4px)_rotateY(-16deg)_rotateX(3deg)] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)] group-active:[transform:perspective(900px)_translateY(-2px)_rotateY(-10deg)_rotateX(2deg)]">
                    <CoverImage :cover="book.cover" :cover-url="book.cover_url" :title="book.name" :author="book.author" />
                  </div>
                  <p class="mt-1.5 line-clamp-2 text-[12px] leading-tight font-medium text-label">{{ book.name }}</p>
                </button>
              </div>
            </section>

            <!-- Reading now -->
            <section>
              <h2 class="mb-2 text-[20px] font-bold tracking-[-0.01em] text-label">Sedang Dibaca</h2>
              <div v-if="continueLoading" class="space-y-2">
                <div v-for="i in 2" :key="i" class="h-[96px] animate-pulse rounded-[14px] bg-card" />
              </div>
              <div v-else-if="continueBooks.length" class="space-y-2.5">
                <ContinueCard v-for="book in continueBooks" :key="book.id" :book="book" @open="openDetail(book)" @read="openReader(book)" />
              </div>
              <div v-else class="rounded-[14px] bg-card px-4 py-5 text-center text-[15px] text-label2">
                Belum ada buku yang sedang dibaca.
              </div>
            </section>

            <!-- Library list -->
            <IOSListGroup title="Perpustakaan">
              <IOSListRow
                v-for="row in statusRows"
                :key="row.key"
                :icon="row.icon"
                :icon-class="row.color"
                :label="row.label"
                :value="row.count"
                @click="openStatus(row.key)"
              />
            </IOSListGroup>

            <!-- Collections -->
            <section v-if="genres.length" class="space-y-3">
              <div class="flex items-end justify-between px-1">
                <div>
                  <h2 class="text-[20px] font-bold tracking-[-0.01em] text-label">Koleksi</h2>
                  <p class="mt-0.5 text-[13px] text-label2">{{ genres.length }} genre untuk dijelajahi</p>
                </div>
                <button class="tap-expand pb-0.5 text-[15px] font-semibold text-blue-text active:opacity-60" @click="openAllBooks">Lihat semua</button>
              </div>

              <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                <button
                  type="button"
                  class="group flex min-h-[108px] flex-col justify-between rounded-[14px] border border-sep bg-card p-4 text-left transition-colors hover:bg-fill active:bg-fill"
                  @click="openAllBooks"
                >
                  <span class="grid h-8 w-8 place-items-center rounded-[9px] bg-blue text-white">
                    <PhBooks :size="20" weight="fill" />
                  </span>
                  <span class="mt-4 flex items-end justify-between gap-2">
                    <span class="min-w-0">
                      <span class="block truncate text-[16px] font-semibold text-label">Semua buku</span>
                      <span class="mt-0.5 block text-[12px] text-label2">{{ stats?.total_books ?? 0 }} buku</span>
                    </span>
                    <PhCaretRight :size="15" weight="bold" class="shrink-0 text-label3" />
                  </span>
                </button>

                <button
                  v-for="(genre, index) in genres"
                  :key="genre"
                  type="button"
                  class="group relative flex min-h-[108px] flex-col justify-between overflow-hidden rounded-[14px] border border-sep bg-card p-4 pl-5 text-left transition-colors hover:bg-fill active:bg-fill"
                  :aria-label="`Buka genre ${genre}`"
                  @click="openGenre(genre)"
                >
                  <span class="absolute inset-y-0 left-0 w-1" :class="getGenreTheme(index).bar" />
                  <span class="grid h-8 w-8 place-items-center rounded-[9px]" :class="getGenreTheme(index).icon">
                    <component :is="getGenreIcon(genre)" :size="19" weight="fill" />
                  </span>
                  <span class="mt-4 flex items-end justify-between gap-2">
                    <span class="min-w-0">
                      <span class="block truncate text-[16px] font-semibold text-label" :title="genre">{{ genre }}</span>
                    </span>
                    <PhCaretRight :size="15" weight="bold" class="shrink-0 text-label3" />
                  </span>
                </button>
              </div>
            </section>
          </div>
        </template>

        <!-- ============ KATALOG ============ -->
        <template v-else-if="activeTab === 'katalog'">
          <IOSNavBar large-title="Katalog" />

          <div class="px-4 pt-3 lg:px-8">
            <SearchBar placeholder="Cari judul, penulis, genre..." @search="setSearch" @clear="clearSearch" />

            <div class="mt-3">
              <SegmentedControl :model-value="selectedSource" :options="sourceOptions" @update:model-value="(v) => setSource(v as '' | 'platform' | 'upload')" />
            </div>

            <div class="mt-3 flex items-center justify-between">
              <p class="text-[13px] text-label2">{{ total }} buku<span v-if="selectedGenre"> · {{ selectedGenre }}</span></p>
              <div class="relative">
                <button
                  class="tap-expand flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[15px] font-semibold text-blue-text active:opacity-60"
                  :aria-expanded="sortOpen"
                  aria-haspopup="true"
                  @click="sortOpen = !sortOpen"
                >
                  <PhArrowsDownUp :size="15" weight="bold" /> {{ activeSortLabel }}
                </button>
                <Transition name="pop">
                  <div v-if="sortOpen" class="absolute right-0 top-10 z-40 w-44 origin-top-right overflow-hidden rounded-[12px] border border-sep bg-card p-1 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                    <button
                      v-for="option in sortOptions"
                      :key="option.value"
                      type="button"
                      class="flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] transition-colors active:bg-fill"
                      :class="sort === option.value ? 'font-semibold text-blue-text' : 'text-label'"
                      @click="chooseSort(option.value)"
                    >
                      {{ option.label }}
                      <PhCheck v-if="sort === option.value" :size="16" weight="bold" />
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <div v-if="selectedGenre || selectedStatus" class="mt-3 flex items-center gap-2">
              <span v-if="selectedGenre" class="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-[13px] font-medium text-label">
                {{ selectedGenre }}
                <button class="tap-expand text-label2 active:opacity-60" @click="setGenre('')" aria-label="Hapus filter genre"><PhX :size="12" weight="bold" /></button>
              </span>
              <span v-if="selectedStatus" class="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-[13px] font-medium text-label">
                {{ selectedStatus === 'to_read' ? 'Ingin Dibaca' : selectedStatus === 'currently_reading' ? 'Sedang Dibaca' : selectedStatus === 'finished' ? 'Selesai' : 'Berhenti' }}
                <button class="tap-expand text-label2 active:opacity-60" @click="setStatus('')" aria-label="Hapus filter status"><PhX :size="12" weight="bold" /></button>
              </span>
            </div>

            <div v-if="loading" class="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              <div v-for="i in 8" :key="i" class="space-y-2">
                <div class="aspect-[2/3] w-full animate-pulse rounded-[8px] bg-gray6" />
                <div class="h-3 w-3/4 animate-pulse rounded bg-gray6" />
              </div>
            </div>

            <div v-else-if="books.length === 0" class="mt-10 flex flex-col items-center text-center">
              <div class="grid h-14 w-14 place-items-center rounded-full bg-fill">
                <PhBooks :size="26" class="text-label2" />
              </div>
              <h3 class="mt-3 text-[17px] font-semibold text-label">Tidak ada buku</h3>
              <p class="mt-1 max-w-xs text-[14px] text-label2">
                {{ selectedSource === 'upload' ? 'Unggah PDF pribadimu untuk mulai membaca.' : 'Coba ubah filter atau kata kunci.' }}
              </p>
              <div class="mt-4 flex gap-2">
                <BaseButton @click="showUploadModal = true">Unggah PDF</BaseButton>
                <BaseButton variant="secondary" @click="openCreateForm">Tambah Buku</BaseButton>
              </div>
            </div>

            <div v-else class="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              <button v-for="book in books" :key="book.id" class="group text-left transition-transform active:scale-[0.98]" @click="openDetail(book)">
                <BookCard :book="book" />
              </button>
            </div>

            <div v-if="hasMore && !loading" class="mt-6 flex justify-center">
              <BaseButton variant="secondary" @click="loadMore">Muat Lebih</BaseButton>
            </div>
          </div>
        </template>

        <!-- ============ PROFIL ============ -->
        <template v-else>
          <IOSNavBar large-title="Profil" />

          <div class="space-y-7 px-4 pt-3 lg:px-8">
            <div class="flex items-center gap-3">
              <span class="grid h-16 w-16 place-items-center rounded-full bg-blue text-[24px] font-semibold text-white">
                {{ (authStore.user?.name || "P").charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-[20px] font-bold text-label">{{ authStore.user?.name || "Pembaca" }}</p>
                <p class="truncate text-[14px] text-label2">{{ authStore.user?.email || "—" }}</p>
              </div>
            </div>

            <IOSListGroup title="Statistik">
              <IOSListRow :icon="PhBooks" icon-class="text-blue-text" label="Koleksi" :value="`${stats?.total_books ?? 0} buku`" :chevron="false" />
              <IOSListRow :icon="PhCheckCircle" icon-class="text-green-text" label="Selesai" :value="`${stats?.status_breakdown?.finished ?? 0} / ${yearlyGoal} buku`" :chevron="false" />
              <IOSListRow :icon="PhBookOpen" icon-class="text-orange-text" label="Sedang dibaca" :value="`${stats?.status_breakdown?.currently_reading ?? 0} buku`" :chevron="false" />
              <IOSListRow :icon="PhClock" icon-class="text-gray" label="Halaman dibaca" :value="`${(stats?.total_pages_read ?? 0).toLocaleString('id-ID')} / ${(stats?.total_pages ?? 0).toLocaleString('id-ID')}`" :chevron="false" />
            </IOSListGroup>

            <IOSListGroup title="Target Tahunan">
              <div v-if="!goalEditing" class="px-4 py-3">
                <div class="flex items-center justify-between">
                  <span class="text-[17px] text-label">{{ stats?.status_breakdown?.finished ?? 0 }} dari {{ yearlyGoal }} buku</span>
                  <button class="tap-expand text-[15px] font-semibold text-blue-text active:opacity-60" @click="goalEditing = true; goalInput = yearlyGoal">Ubah</button>
                </div>
                <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray5">
                  <div class="h-full w-full origin-left rounded-full bg-blue transition-transform duration-500" :style="{ transform: `scaleX(${goalPercent / 100})` }" />
                </div>
              </div>
              <div v-else class="flex items-center gap-2 px-4 py-3">
                <input v-model.number="goalInput" type="number" min="1" max="500" class="w-20 rounded-[10px] bg-fill px-3 py-2 text-[16px] text-label focus:outline-none focus:ring-2 focus:ring-blue" @keyup.enter="saveGoal" />
                <BaseButton size="sm" @click="saveGoal">Simpan</BaseButton>
                <BaseButton size="sm" variant="secondary" @click="cancelGoal">Batal</BaseButton>
              </div>
            </IOSListGroup>

            <IOSListGroup title="Tampilan">
              <div class="px-4 py-3">
                <SegmentedControl :model-value="preference" :options="[{ value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }, { value: 'system', label: 'Sistem' }]" @update:model-value="(v) => setTheme(v as 'light' | 'dark' | 'system')" />
              </div>
            </IOSListGroup>

            <IOSListGroup>
              <IOSListRow :icon="PhSignOut" icon-class="text-red-text" label="Keluar" :chevron="false" @click="handleLogout" />
            </IOSListGroup>
          </div>
        </template>
    </main>

    <!-- Detail sheet -->
    <BaseModal :show="!!selectedBook" @close="selectedBook = null">
      <div v-if="selectedBook" class="flex gap-4">
        <div class="h-[150px] w-[100px] shrink-0 origin-left overflow-hidden rounded-[8px] transition-transform duration-300 ease-out will-change-transform hover:[transform:perspective(900px)_rotateY(-16deg)_rotateX(3deg)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
          <CoverImage :cover="selectedBook.cover" :cover-url="selectedBook.cover_url" :title="selectedBook.name" :author="selectedBook.author" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-[20px] font-bold leading-tight text-label">{{ selectedBook.name }}</h2>
          <p class="mt-0.5 text-[15px] text-label2">{{ selectedBook.author || "Penulis Anonim" }}</p>
          <p class="mt-1 text-[14px] text-label2">
            {{ selectedBook.genre || "Tanpa genre" }}<span v-if="selectedBook.source === 'platform'"> · Platform</span>
          </p>
          <div v-if="(selectedBook.pdf_total_pages ?? selectedBook.pages ?? 0) > 0" class="mt-3">
            <ProgressBar :total="selectedBook.pdf_total_pages ?? selectedBook.pages ?? 0" :value="selectedBook.current_page ?? selectedBook.pages_read ?? 0" color="terra" />
          </div>
        </div>
      </div>

      <p v-if="selectedBook?.description" class="mt-4 text-[15px] leading-relaxed text-label2" :class="!synopsisExpanded ? 'line-clamp-4' : ''">
        {{ selectedBook.description }}
      </p>
      <button v-if="selectedBook?.description && selectedBook.description.length > 160" class="tap-expand mt-1 text-[15px] font-medium text-blue-text active:opacity-60" @click="synopsisExpanded = !synopsisExpanded">
        {{ synopsisExpanded ? "Sembunyikan" : "Selengkapnya" }}
      </button>

      <div class="mt-4 rounded-[12px] bg-bg2 dark:bg-gray6">
        <div class="flex justify-between border-b border-sep px-4 py-2.5 text-[15px]"><span class="text-label2">Penerbit</span><span class="truncate pl-3 text-right text-label">{{ selectedBook?.publisher || "-" }}</span></div>
        <div class="flex justify-between border-b border-sep px-4 py-2.5 text-[15px]"><span class="text-label2">Rilis</span><span class="text-label">{{ formatDate(selectedBook?.release_date) }}</span></div>
        <div class="flex justify-between px-4 py-2.5 text-[15px]"><span class="text-label2">Berkas</span><span class="truncate pl-3 text-right text-label">{{ selectedBook?.file_original_name || selectedBook?.pdf_original_name || "Manual" }}</span></div>
      </div>

      <div class="mt-5">
        <p class="mb-2 px-1 text-[13px] font-medium text-label2">Status Membaca</p>
        <StatusSelect
          full
          :model-value="selectedBook?.status ?? 'to_read'"
          @update:model-value="changeStatus"
        />
      </div>

      <div class="mt-5 flex flex-col gap-2">
        <BaseButton v-if="selectedBook?.has_file || selectedBook?.has_pdf" class="w-full" @click="readSelected">
          <PhBookOpen :size="16" weight="bold" /> {{ readLabel(selectedBook) }}
        </BaseButton>
        <BaseButton v-if="selectedBook?.source !== 'platform'" variant="secondary" class="w-full" @click="editSelected">
          <PhPencilSimple :size="16" weight="bold" /> Edit Buku
        </BaseButton>
        <BaseButton v-if="selectedBook?.source !== 'platform'" variant="danger" class="w-full" @click="deleteSelected">
          <PhTrash :size="16" weight="bold" /> Hapus Buku
        </BaseButton>
        <p v-else class="pt-1 text-center text-[13px] text-label2">Buku platform tidak dapat diubah atau dihapus.</p>
      </div>
    </BaseModal>

    <BaseModal :show="showForm" @close="closeForm">
      <BookForm :form="form" :is-edit="isEdit" :is-submitting="isSubmitting" :coverPreviewUrl="coverPreviewUrl" :coverFile="coverFile" :isFetchingCover="isFetchingCover" @submit="submitForm" @cancel="closeForm" @open-lookup="showLookupModal = true" @cover-change="setCover" />
    </BaseModal>
    <BookLookupModal :show="showLookupModal" @close="showLookupModal = false" @select="handleLookupSelect" />
    <UploadBookModal :show="showUploadModal" :uploading="isUploading" :progress="uploadProgress" @close="showUploadModal = false" @upload="handleUpload" />
  </div>
</template>
