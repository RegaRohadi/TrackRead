<script setup lang="ts">
import { PhCaretLeft } from "@phosphor-icons/vue";

defineProps<{
  largeTitle?: string;
  back?: boolean;
  backLabel?: string;
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();
</script>

<template>
  <header class="px-4 pt-3 pb-1 lg:px-8">
    <button
      v-if="back"
      type="button"
      class="mb-1 flex items-center gap-0.5 text-[17px] text-blue"
      @click="emit('back')"
    >
      <PhCaretLeft :size="18" weight="bold" />
      <span>{{ backLabel || "Kembali" }}</span>
    </button>
    <h1 v-if="largeTitle" class="text-[34px] leading-tight font-bold tracking-[-0.02em] text-label">{{ largeTitle }}</h1>
  </header>
</template>
