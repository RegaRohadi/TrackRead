<script setup lang="ts">
import type { Component } from "vue";
import { PhCaretRight } from "@phosphor-icons/vue";

withDefaults(
  defineProps<{
    icon?: Component;
    iconClass?: string;
    label: string;
    value?: string | number;
    chevron?: boolean;
  }>(),
  { chevron: true }
);

const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-fill"
    @click="emit('click')"
  >
    <span v-if="icon" class="grid w-7 shrink-0 place-items-center">
      <component :is="icon" :size="20" :class="iconClass || 'text-label'" />
    </span>
    <span class="flex-1 truncate text-[17px] text-label">{{ label }}</span>
    <span v-if="value !== undefined && value !== null" class="text-[17px] text-label2 tabular-nums">{{ value }}</span>
    <PhCaretRight v-if="chevron" :size="15" weight="bold" class="shrink-0 text-label3" />
  </button>
</template>
