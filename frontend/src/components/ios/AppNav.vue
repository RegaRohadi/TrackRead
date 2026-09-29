<script setup lang="ts">
import { PhBooks, PhSquaresFour, PhUser } from "@phosphor-icons/vue";
import type { Component } from "vue";

type TabKey = "buku" | "katalog" | "profil";

const logo = "/logo-mark.png";

defineProps<{ active: TabKey }>();
const emit = defineEmits<{ (e: "select", tab: TabKey): void }>();

const items: { value: TabKey; label: string; icon: Component }[] = [
  { value: "buku", label: "Buku", icon: PhBooks },
  { value: "katalog", label: "Katalog", icon: PhSquaresFour },
  { value: "profil", label: "Profil", icon: PhUser },
];
</script>

<template>
  <!-- Top navbar (all sizes) -->
  <header class="sticky top-0 z-40 backdrop-blur-xl" style="background: var(--ios-bar)">
    <div class="pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-gradient-to-b from-black/5 to-transparent" aria-hidden="true"></div>
    <div class="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 lg:px-8">
      <button class="tap-expand flex items-center gap-2.5" @click="emit('select', 'buku')">
        <img :src="logo" alt="" class="h-9 w-9 rounded-[9px] object-cover" />
        <span class="font-logo text-[19px] leading-none font-semibold tracking-[-0.01em]">
          <span class="text-[#4E5A2B] dark:text-[#C3CF95]">Track</span><span class="text-[#B0562C] dark:text-[#D27A4E]">Read</span>
        </span>
      </button>

      <nav class="ml-3 hidden items-center gap-1 lg:flex">
        <button
          v-for="item in items"
          :key="item.value"
          type="button"
          class="tap-expand flex items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] font-medium transition-colors"
          :class="item.value === active ? 'bg-fill text-blue-text' : 'text-label hover:bg-fill'"
          @click="emit('select', item.value)"
        >
          <component :is="item.icon" :size="18" :weight="item.value === active ? 'fill' : 'regular'" />
          {{ item.label }}
        </button>
      </nav>

      <div class="ml-auto flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
  </header>

  <!-- Mobile tab bar -->
  <nav
    class="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    style="background: var(--ios-bar)"
  >
    <div class="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-t from-black/5 to-transparent" aria-hidden="true"></div>
    <div class="mx-auto flex max-w-lg items-stretch">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        class="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors"
        :class="item.value === active ? 'text-blue-text' : 'text-label2'"
        @click="emit('select', item.value)"
      >
        <component :is="item.icon" :size="24" :weight="item.value === active ? 'fill' : 'regular'" />
        {{ item.label }}
      </button>
    </div>
  </nav>
</template>
