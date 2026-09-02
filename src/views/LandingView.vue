<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  PhArrowRight,
  PhBookOpen,
  PhBookmarkSimple,
  PhChartLineUp,
  PhMagicWand,
  PhQuotes,
} from "@phosphor-icons/vue";
import LandingNav from "@/components/landing/LandingNav.vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

function goStart() {
  if (authStore.isAuthenticated) router.push({ name: "books" });
  else router.push({ name: "auth" });
}
function goDemo() {
  const el = document.getElementById("cara");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// simple reveal on scroll
const revealEls = ref<HTMLElement[]>([]);
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
});
</script>

<template>
  <div id="top" class="min-h-screen bg-base-50 text-base-800 antialiased dark:bg-base-950 dark:text-base-200">
    <LandingNav />

    <!-- HERO asymmetric split, fits viewport, pt cap -->
    <section class="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
      <div class="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <!-- Left copy 7 cols -->
        <div class="lg:col-span-7">
          <p class="mb-3 text-[11px] font-medium tracking-[0.2em] text-terra-700 uppercase dark:text-terra-400">Katalog pribadi</p>
          <h1 class="font-display pb-1 text-4xl leading-[0.95] tracking-tight text-base-900 sm:text-5xl lg:text-6xl dark:text-base-50">
            Bacaanmu,<br />
            <span class="font-display italic leading-[1.1] text-terra-700 dark:text-terra-400">akhirnya tertata.</span>
          </h1>
          <p class="mt-4 max-w-[48ch] text-base leading-relaxed text-base-600 dark:text-base-400">
            Catat buku, pantau halaman, dan lihat progres tanpa spreadsheet. Dibuat untuk pembaca yang ingin konsisten.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <button class="inline-flex items-center gap-2 border border-terra-700 bg-terra-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-terra-800" @click="goStart">
              Mulai gratis <PhArrowRight :size="16" weight="bold" />
            </button>
            <button class="inline-flex items-center gap-2 border border-base-300 bg-white px-5 py-2.5 text-sm font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200" @click="goDemo">
              Lihat cara kerja
            </button>
          </div>
        </div>

        <!-- Right asset 5 cols -->
        <div class="relative lg:col-span-5">
          <div class="relative overflow-hidden border border-base-200 bg-white p-3 dark:border-base-800 dark:bg-base-900">
            <img
              src="https://picsum.photos/seed/trackread-hero/880/1060"
              alt="Tumpukan buku di meja kayu dengan cahaya lembut"
              class="h-[420px] w-full object-cover sm:h-[480px] lg:h-[520px]"
              loading="eager"
            />
            <!-- floating progress card -->
            <div class="absolute bottom-4 left-4 right-4 border border-base-200 bg-white p-4 shadow-nudge dark:border-base-700 dark:bg-base-900 sm:left-6 sm:right-auto sm:w-72">
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium tracking-wide text-base-500 dark:text-base-400">Sedang dibaca</p>
                <span class="rounded bg-terra-50 px-1.5 py-0.5 text-[11px] font-medium text-terra-700 dark:bg-terra-950 dark:text-terra-300">68%</span>
              </div>
              <p class="mt-1 font-display text-[15px] font-semibold leading-tight text-base-900 dark:text-base-100">Atomic Habits</p>
              <p class="text-xs text-base-500 dark:text-base-400">James Clear · 212 / 312 hal</p>
              <div class="mt-3 h-1 w-full bg-base-100 dark:bg-base-800">
                <div class="h-full bg-terra-600" style="width: 68%"></div>
              </div>
              <div class="mt-2 flex gap-2">
                <span class="flex-1 border border-base-200 bg-base-50 px-2 py-1 text-center text-[11px] font-medium text-base-600 dark:border-base-700 dark:bg-base-800 dark:text-base-300">Fiksi 32%</span>
                <span class="flex-1 border border-base-200 bg-white px-2 py-1 text-center text-[11px] font-medium text-base-600 dark:border-base-700 dark:bg-base-900">Target 12 buku</span>
              </div>
            </div>
          </div>
          <!-- subtle accent block behind -->
          <div class="absolute -z-10 -bottom-4 -right-4 hidden h-full w-full border border-terra-200 bg-terra-50 dark:border-terra-900 dark:bg-terra-950/30 lg:block"></div>
        </div>
      </div>
    </section>

    <!-- LOGO WALL under hero, real SVG logos, logo only -->
    <section class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <div class="mt-12 border-y border-base-200 py-6 dark:border-base-800">
        <div data-reveal class="reveal flex flex-wrap items-center justify-center gap-8 opacity-0 translate-y-2 transition duration-500 sm:justify-between">
          <p class="w-full text-center text-xs font-medium text-base-400 sm:w-auto sm:text-left dark:text-base-500">Dipakai pembaca di</p>
          <div class="flex flex-wrap items-center justify-center gap-7">
            <img src="https://cdn.simpleicons.org/goodreads/1C1C19" alt="Goodreads" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
            <img src="https://cdn.simpleicons.org/notion/1C1C19" alt="Notion" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
            <img src="https://cdn.simpleicons.org/pocket/1C1C19" alt="Pocket" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
            <img src="https://cdn.simpleicons.org/medium/1C1C19" alt="Medium" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
            <img src="https://cdn.simpleicons.org/readwise/1C1C19" alt="Readwise" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
            <img src="https://cdn.simpleicons.org/obsidian/1C1C19" alt="Obsidian" class="h-5 opacity-60 dark:invert dark:opacity-70" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- BENTO 3 cells with rhythm -->
    <section id="koleksi" class="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div class="max-w-2xl">
        <h2 class="font-display text-3xl font-semibold tracking-tight text-base-900 sm:text-4xl dark:text-base-50">Koleksi yang hidup, bukan daftar mati.</h2>
        <p class="mt-3 max-w-[60ch] text-sm leading-relaxed text-base-600 dark:text-base-400">Tiga cara TrackRead menjaga bacaan tetap terlihat dan bergerak. Tidak ada tabel panjang, hanya konteks yang kamu butuh.</p>
      </div>

      <div data-reveal class="reveal mt-10 grid gap-4 opacity-0 translate-y-2 transition duration-500 delay-100 lg:grid-cols-[1.35fr_0.85fr] lg:grid-rows-2">
        <!-- Cell 1 large with image -->
        <div class="relative overflow-hidden border border-base-200 bg-white p-0 dark:border-base-800 dark:bg-base-900 lg:row-span-2">
          <img src="https://picsum.photos/seed/trackread-bento1/900/900" alt="Buku terbuka di meja kerja minimal" class="h-56 w-full object-cover lg:h-full lg:min-h-[420px]" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>
          <div class="absolute bottom-0 p-6">
            <h3 class="max-w-[18ch] font-display text-2xl font-semibold leading-tight text-white">Lihat halaman demi halaman, bukan janji.</h3>
            <p class="mt-2 max-w-[32ch] text-sm leading-relaxed text-white/80">Bar progres, status, dan riwayat yang sinkron otomatis saat kamu update.</p>
          </div>
        </div>
        <!-- Cell 2 tinted -->
        <div class="border border-terra-200 bg-terra-50 p-6 dark:border-terra-900 dark:bg-terra-950/40">
          <PhBookmarkSimple :size="18" weight="fill" class="text-terra-700 dark:text-terra-400" />
          <h3 class="mt-3 font-display text-lg font-semibold text-base-900 dark:text-base-100">Genre dan status yang rapi</h3>
          <p class="mt-2 text-sm leading-relaxed text-base-600 dark:text-base-400">Filter ingin dibaca, sedang dibaca, selesai. Cari judul, penulis, atau ISBN dalam sekejap.</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="border border-base-300 bg-white px-2.5 py-1 text-xs font-medium text-base-700 dark:border-base-700 dark:bg-base-900 dark:text-base-200">Fiksi</span>
            <span class="border border-base-300 bg-white px-2.5 py-1 text-xs font-medium text-base-700 dark:border-base-700 dark:bg-base-900">Nonfiksi</span>
            <span class="bg-terra-700 px-2.5 py-1 text-xs font-medium text-white">Sedang dibaca</span>
          </div>
        </div>
        <!-- Cell 3 numbers -->
        <div class="border border-base-200 bg-white p-6 dark:border-base-800 dark:bg-base-900">
          <div class="flex items-baseline gap-3">
            <span class="font-display text-4xl font-semibold text-base-900 dark:text-base-50">312</span>
            <span class="text-sm text-base-500 dark:text-base-400">halaman terlacak minggu ini</span>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-base-200 pt-4 dark:border-base-800">
            <div><p class="font-display text-xl font-semibold text-terra-700 dark:text-terra-400">12</p><p class="text-xs text-base-500">selesai</p></div>
            <div><p class="font-display text-xl font-semibold text-base-900 dark:text-base-100">4</p><p class="text-xs text-base-500">sedang</p></div>
            <div><p class="font-display text-xl font-semibold text-base-900 dark:text-base-100">27</p><p class="text-xs text-base-500">koleksi</p></div>
          </div>
          <p class="mt-3 text-xs text-base-400 dark:text-base-500">Angka contoh, data kamu tetap privat.</p>
        </div>
      </div>
    </section>

    <!-- EDITORIAL FULL BLEED feature -->
    <section id="cara" class="border-y border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
      <div class="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-12">
        <div class="relative lg:col-span-7">
          <img src="https://picsum.photos/seed/trackread-editorial/1200/900" alt="Rak buku dengan pencahayaan lembut" class="h-[360px] w-full object-cover sm:h-[480px] lg:h-[560px]" loading="lazy" />
          <div class="absolute bottom-4 left-4 border border-white/20 bg-base-900/85 px-3 py-2 text-xs font-medium text-white backdrop-blur">Koleksi 27 buku · 4 sedang dibaca</div>
        </div>
        <div class="flex flex-col justify-center px-6 py-10 sm:px-8 lg:col-span-5 lg:px-12">
          <div data-reveal class="reveal opacity-0 translate-y-2 transition duration-500">
            <h2 class="font-display text-3xl font-semibold leading-tight tracking-tight text-base-900 dark:text-base-50">Dari tumpukan acak jadi ritme harian.</h2>
            <p class="mt-4 text-sm leading-relaxed text-base-600 dark:text-base-400">Tambah buku manual atau auto fill dari Google Books dan Open Library. Cover diambil otomatis, status menyesuaikan halaman yang kamu baca.</p>
            <ul class="mt-6 space-y-3">
              <li class="flex gap-3">
                <span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-terra-200 bg-terra-50 text-terra-700 dark:border-terra-800 dark:bg-terra-950 dark:text-terra-400"><PhMagicWand :size="12" weight="fill" /></span>
                <div><p class="text-sm font-medium text-base-900 dark:text-base-100">Auto fill judul dan cover</p><p class="text-sm text-base-500 dark:text-base-400">Tempel ISBN atau cari judul, data terisi rapi.</p></div>
              </li>
              <li class="flex gap-3">
                <span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-terra-200 bg-terra-50 text-terra-700 dark:border-terra-800 dark:bg-terra-950"><PhChartLineUp :size="12" weight="bold" /></span>
                <div><p class="text-sm font-medium text-base-900 dark:text-base-100">Target tahunan yang jujur</p><p class="text-sm text-base-500">Lihat 7 dari 12 buku selesai, tanpa grafik berlebihan.</p></div>
              </li>
            </ul>
            <button class="mt-8 inline-flex items-center gap-2 border border-terra-700 bg-terra-700 px-4 py-2 text-sm font-medium text-white hover:bg-terra-800" @click="goStart">
              Mulai gratis <PhArrowRight :size="14" weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- READING RHYTHM 2-col card grid, grouped not divide-y -->
    <section class="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 class="max-w-[14ch] font-display text-3xl font-semibold tracking-tight text-base-900 sm:text-4xl dark:text-base-50">Ritme baca yang kamu pilih.</h2>
        <p class="max-w-[36ch] text-sm leading-relaxed text-base-600 dark:text-base-400">Tiga kebiasaan kecil yang dijaga TrackRead agar kamu tetap membaca, bukan hanya mengumpulkan.</p>
      </div>

      <div data-reveal class="reveal mt-10 grid gap-4 opacity-0 translate-y-2 transition duration-500 sm:grid-cols-2 lg:grid-cols-3">
        <div class="border border-base-200 bg-white p-6 dark:border-base-800 dark:bg-base-900">
          <PhBookOpen :size="20" weight="duotone" class="text-terra-700 dark:text-terra-400" />
          <h3 class="mt-4 font-display text-lg font-semibold text-base-900 dark:text-base-100">Catat tanpa gesekan</h3>
          <p class="mt-2 text-sm leading-relaxed text-base-600 dark:text-base-400">Tambah buku dalam 30 detik. Nama, penulis, halaman, dan sampul. Tidak ada form yang melelahkan.</p>
          <div class="mt-4 border-t border-base-200 pt-4 dark:border-base-800">
            <p class="text-xs font-medium text-base-400 dark:text-base-500">Contoh</p>
            <p class="mt-1 text-sm text-base-700 dark:text-base-200">Dune · 412 / 688 hal · sedang dibaca</p>
          </div>
        </div>
        <div class="border border-base-200 bg-white p-6 dark:border-base-800 dark:bg-base-900">
          <PhChartLineUp :size="20" weight="duotone" class="text-terra-700 dark:text-terra-400" />
          <h3 class="mt-4 font-display text-lg font-semibold text-base-900 dark:text-base-100">Pantau dengan jujur</h3>
          <p class="mt-2 text-sm leading-relaxed text-base-600 dark:text-base-400">Progres halaman, persentase, dan status yang sinkron. Tidak ada skor buatan.</p>
          <div class="mt-4 border-t border-base-200 pt-4 dark:border-base-800">
            <p class="text-xs font-medium text-base-400">Minggu ini</p>
            <p class="mt-1 text-sm text-base-700 dark:text-base-200">4 buku diselesaikan · 842 hal</p>
          </div>
        </div>
        <div class="border border-base-200 bg-white p-6 dark:border-base-800 dark:bg-base-900 sm:col-span-2 lg:col-span-1">
          <PhBookmarkSimple :size="20" weight="duotone" class="text-terra-700 dark:text-terra-400" />
          <h3 class="mt-4 font-display text-lg font-semibold text-base-900 dark:text-base-100">Target yang ringan</h3>
          <p class="mt-2 text-sm leading-relaxed text-base-600 dark:text-base-400">Tentukan target tahunan. Ubah kapan saja. Lihat sisa buku tanpa tekanan.</p>
          <div class="mt-4 border-t border-base-200 pt-4 dark:border-base-800">
            <p class="text-xs font-medium text-base-400">Target 2026</p>
            <p class="mt-1 text-sm text-base-700 dark:text-base-200">7 dari 12 buku · 58%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- QUOTE centered, max 3 lines -->
    <section id="kutipan" class="border-y border-base-200 bg-base-900 py-16 dark:border-base-800 dark:bg-base-900 sm:py-20">
      <div data-reveal class="reveal mx-auto max-w-3xl px-6 text-center opacity-0 translate-y-2 transition duration-500">
        <PhQuotes :size="28" weight="fill" class="mx-auto text-terra-400" />
        <blockquote class="mt-4 font-display text-2xl font-medium leading-tight text-white sm:text-3xl">
          Saya akhirnya menyelesaikan buku yang tertunda dua tahun.
        </blockquote>
        <p class="mt-4 text-sm text-base-400">Rani, pembaca di Jakarta <span class="text-base-600">·</span> 34 buku tahun ini</p>
      </div>
    </section>

    <!-- CTA + FOOTER split -->
    <section class="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
      <div class="grid gap-10 border border-base-200 bg-white p-6 dark:border-base-800 dark:bg-base-900 sm:p-8 lg:grid-cols-12 lg:p-10">
        <div class="lg:col-span-7">
          <h2 class="max-w-[16ch] font-display text-3xl font-semibold leading-tight tracking-tight text-base-900 sm:text-4xl dark:text-base-50">Mulai koleksi kecil yang bertahan lama.</h2>
          <p class="mt-3 max-w-[44ch] text-sm leading-relaxed text-base-600 dark:text-base-400">Gratis untuk memulai. Masuk, tambah tiga buku pertama, dan lihat ritme kamu terbentuk dalam seminggu.</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button class="inline-flex items-center gap-2 border border-terra-700 bg-terra-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-terra-800" @click="goStart">
              Mulai gratis <PhArrowRight :size="16" weight="bold" />
            </button>
            <button class="inline-flex items-center gap-2 border border-base-300 bg-white px-5 py-2.5 text-sm font-medium text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200" @click="scrollTo('koleksi')">
              Lihat koleksi
            </button>
          </div>
        </div>
        <div class="lg:col-span-5 lg:border-l lg:border-base-200 lg:pl-10 dark:lg:border-base-800">
          <p class="text-xs font-medium text-base-500 dark:text-base-400">Tetap terhubung</p>
          <form class="mt-3 flex gap-2" @submit.prevent>
            <label class="sr-only" for="cta-email">Email</label>
            <input
              id="cta-email"
              type="email"
              placeholder="email@contoh.com"
              class="w-full border border-base-300 bg-white px-3 py-2 text-sm text-base-800 placeholder:text-base-400 focus:border-terra-600 focus:outline-none dark:border-base-700 dark:bg-base-800 dark:text-base-100 dark:placeholder:text-base-500"
            />
            <button type="submit" class="shrink-0 border border-base-900 bg-base-900 px-4 py-2 text-sm font-medium text-white hover:bg-base-800 dark:border-base-100 dark:bg-base-100 dark:text-base-900">Kirim</button>
          </form>
          <p class="mt-2 text-xs text-base-400 dark:text-base-500">Kami hanya mengirim pembaruan fitur. Tidak ada spam.</p>
          <div class="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p class="font-medium text-base-900 dark:text-base-100">Produk</p>
              <ul class="mt-2 space-y-1.5 text-base-600 dark:text-base-400">
                <li><button class="hover:text-base-900 dark:hover:text-base-100" @click="scrollTo('cara')">Cara kerja</button></li>
                <li><button class="hover:text-base-900" @click="scrollTo('koleksi')">Koleksi</button></li>
                <li><button class="hover:text-base-900" @click="goStart">Masuk</button></li>
              </ul>
            </div>
            <div>
              <p class="font-medium text-base-900 dark:text-base-100">Bantuan</p>
              <ul class="mt-2 space-y-1.5 text-base-600 dark:text-base-400">
                <li><a class="hover:text-base-900" href="#">Kebijakan privasi</a></li>
                <li><a class="hover:text-base-900" href="#">Syarat layanan</a></li>
                <li><a class="hover:text-base-900" href="#">Kontak</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex flex-col gap-2 text-xs text-base-400 dark:text-base-500 sm:flex-row sm:items-center sm:justify-between">
        <p>2026 TrackRead. Dibuat untuk pembaca yang ingin konsisten.</p>
        <p>Made in Indonesia</p>
      </div>
    </section>
  </div>
</template>

<style>
.reveal.is-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
