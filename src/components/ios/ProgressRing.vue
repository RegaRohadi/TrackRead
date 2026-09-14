<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value?: number;
    size?: number;
    stroke?: number;
    overlay?: boolean;
  }>(),
  { value: 0, size: 30, stroke: 3, overlay: false }
);

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.value ?? 0))));
const radius = computed(() => (props.size - props.stroke) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - clamped.value / 100));
const trackColor = computed(() => (props.overlay ? "rgba(255,255,255,0.35)" : "var(--ios-gray4)"));
const progressColor = computed(() => (props.overlay ? "#ffffff" : "var(--ios-blue)"));
</script>

<template>
  <div
    class="relative grid place-items-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="progressbar"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`${clamped}% selesai`"
  >
    <span
      v-if="overlay"
      class="absolute inset-0 rounded-full"
      style="background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(2px)"
    />
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="relative block -rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="progressColor"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
    <span
      v-if="overlay"
      class="absolute text-[9px] font-semibold text-white tabular-nums"
    >
      {{ clamped }}%
    </span>
  </div>
</template>
