<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    total: number;
    value: number;
    showLabel?: boolean;
    color?: "terra" | "emerald";
  }>(),
  {
    showLabel: true,
    color: "terra",
  }
);

const safeTotal = computed(() => Math.max(0, Number(props.total) || 0));
const safeValue = computed(() => Math.max(0, Number(props.value) || 0));

const progress = computed(() => {
  if (safeTotal.value <= 0) return 0;
  return Math.min(100, Math.round((safeValue.value / safeTotal.value) * 100));
});

const barClass = computed(() => ({
  terra: "bg-blue",
  emerald: "bg-green",
})[props.color]);
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="showLabel" class="flex justify-between text-[13px] text-label2">
      <span>hal {{ safeValue }} / {{ safeTotal }}</span>
      <span class="tabular-nums">{{ progress }}%</span>
    </div>

    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-gray5"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full w-full origin-left rounded-full transition-transform duration-300"
        :class="barClass"
        :style="{ transform: `scaleX(${progress / 100})` }"
      />
    </div>
  </div>
</template>
