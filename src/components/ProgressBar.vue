<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    total: number;
    value: number;
    showLabel?: boolean;
    color?: "blue" | "green" | "emerald";
  }>(),
  {
    showLabel: true,
    color: "emerald",
  }
);

const safeTotal = computed(() => Math.max(0, Number(props.total) || 0));
const safeValue = computed(() => Math.max(0, Number(props.value) || 0));

const progress = computed(() => {
  if (safeTotal.value <= 0) return 0;

  return Math.min(100, Math.round((safeValue.value / safeTotal.value) * 100));
});

const colorClass = computed(() => ({
  blue: "bg-blue-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
})[props.color]);
</script>

<template>
  <div class="space-y-1">
    <div
      v-if="showLabel"
      class="flex justify-between text-xs text-gray-500"
    >
      <span>{{ safeValue }} / {{ safeTotal }} pages</span>
      <span>{{ progress }}%</span>
    </div>

    <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="colorClass"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
