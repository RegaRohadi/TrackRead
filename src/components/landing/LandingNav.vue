<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { PhList, PhX, PhSun, PhMoon } from "@phosphor-icons/vue";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/composables/useTheme";

const router = useRouter();
const authStore = useAuthStore();
const { theme, toggleTheme } = useTheme();
const mobileOpen = ref(false);

function goAuth() {
  router.push({ name: "auth" });
}
function goLibrary() {
  if (authStore.isAuthenticated) router.push({ name: "books" });
  else router.push({ name: "auth" });
}
function scrollTo(id: string) {
  mobileOpen.value = false;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
</script>

<template>
  <nav class="sticky top-0 z-30 border-b border-base-200 bg-base-50/80 backdrop-blur-md dark:border-base-800 dark:bg-base-950/80">
    <div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
      <!-- Left brand -->
      <button class="flex items-center gap-3 text-left" @click="scrollTo('top')">
        <span class="flex h-8 w-8 items-center justify-center border border-terra-700 bg-terra-700 text-[11px] font-bold tracking-widest text-white">TR</span>
        <span class="font-display text-[17px] font-semibold tracking-tight text-base-900 dark:text-base-50">TrackRead</span>
      </button>

      <!-- Center links desktop single line -->
      <div class="hidden items-center gap-7 lg:flex">
        <button class="text-sm font-medium text-base-600 hover:text-base-900 dark:text-base-400 dark:hover:text-base-100" @click="scrollTo('cara')">Cara kerja</button>
        <button class="text-sm font-medium text-base-600 hover:text-base-900 dark:text-base-400 dark:hover:text-base-100" @click="scrollTo('koleksi')">Koleksi</button>
        <button class="text-sm font-medium text-base-600 hover:text-base-900 dark:text-base-400 dark:hover:text-base-100" @click="scrollTo('kutipan')">Cerita</button>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        <button
          @click="toggleTheme"
          class="hidden h-9 w-9 items-center justify-center border border-base-200 bg-white text-base-600 hover:bg-base-100 dark:border-base-800 dark:bg-base-900 dark:text-base-300 sm:inline-flex"
          :aria-label="theme === 'dark' ? 'Mode terang' : 'Mode gelap'"
        >
          <PhMoon v-if="theme === 'dark'" :size="16" weight="duotone" />
          <PhSun v-else :size="16" weight="duotone" />
        </button>
        <button
          class="hidden px-3.5 py-2 text-sm font-medium text-base-700 hover:text-base-900 dark:text-base-300 sm:inline-flex"
          @click="goAuth"
        >
          Masuk
        </button>
        <button
          class="inline-flex items-center justify-center border border-terra-700 bg-terra-700 px-4 py-2 text-sm font-medium text-white hover:bg-terra-800"
          @click="goLibrary"
        >
          Mulai gratis
        </button>
        <button class="inline-flex h-9 w-9 items-center justify-center border border-base-200 bg-white text-base-700 dark:border-base-800 dark:bg-base-900 lg:hidden" @click="mobileOpen = !mobileOpen" aria-label="Menu">
          <PhX v-if="mobileOpen" :size="18" />
          <PhList v-else :size="18" />
        </button>
      </div>
    </div>
    <!-- Mobile panel -->
    <div v-if="mobileOpen" class="border-t border-base-200 bg-white px-4 py-4 dark:border-base-800 dark:bg-base-900 lg:hidden">
      <div class="flex flex-col gap-3">
        <button class="py-2 text-left text-sm font-medium text-base-700 dark:text-base-200" @click="scrollTo('cara')">Cara kerja</button>
        <button class="py-2 text-left text-sm font-medium text-base-700 dark:text-base-200" @click="scrollTo('koleksi')">Koleksi</button>
        <button class="py-2 text-left text-sm font-medium text-base-700 dark:text-base-200" @click="scrollTo('kutipan')">Cerita</button>
        <button class="mt-2 flex h-9 w-9 items-center justify-center border border-base-200 bg-white dark:border-base-800 dark:bg-base-900" @click="toggleTheme">
          <PhMoon v-if="theme === 'dark'" :size="16" />
          <PhSun v-else :size="16" />
        </button>
      </div>
    </div>
  </nav>
</template>
