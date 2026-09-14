<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ title?: string; author?: string | null }>(), {
  title: "Tanpa Judul",
  author: null,
});

interface Palette {
  from: string;
  to: string;
  ink: string;
  motif: "circle" | "stripes" | "arc" | "grid";
}

const PALETTES: Palette[] = [
  { from: "#ff3b30", to: "#ff9500", ink: "#ffffff", motif: "circle" },
  { from: "#0a84ff", to: "#5ac8fa", ink: "#ffffff", motif: "stripes" },
  { from: "#248a3d", to: "#34c759", ink: "#ffffff", motif: "arc" },
  { from: "#af52de", to: "#ff2d55", ink: "#ffffff", motif: "grid" },
  { from: "#ff9500", to: "#ffcc00", ink: "#2b1a00", motif: "circle" },
  { from: "#3634a3", to: "#af52de", ink: "#ffffff", motif: "stripes" },
  { from: "#00a2a2", to: "#0a84ff", ink: "#ffffff", motif: "arc" },
  { from: "#ff2d55", to: "#ff6482", ink: "#ffffff", motif: "grid" },
  { from: "#3a3a3c", to: "#8e8e93", ink: "#ffffff", motif: "circle" },
  { from: "#1c1c1e", to: "#48484a", ink: "#ffd60a", motif: "stripes" },
];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const palette = computed<Palette>(() => {
  const key = `${props.title ?? ""}|${props.author ?? ""}`;
  const found = PALETTES[hash(key) % PALETTES.length];
  return found ?? { from: "#0a84ff", to: "#5ac8fa", ink: "#ffffff", motif: "circle" as const };
});
</script>

<template>
  <div
    class="gen-cover"
    :style="{ '--from': palette.from, '--to': palette.to, '--ink': palette.ink }"
    role="img"
    :aria-label="`Sampul ${title}`"
  >
    <svg class="gen-motif" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
      <g v-if="palette.motif === 'circle'" fill="none" :stroke="palette.ink" stroke-width="6">
        <circle cx="78" cy="30" r="26" />
        <circle cx="78" cy="30" r="11" />
      </g>
      <g v-else-if="palette.motif === 'stripes'" :stroke="palette.ink" stroke-width="7">
        <line x1="-10" y1="120" x2="60" y2="30" />
        <line x1="6" y1="132" x2="76" y2="42" />
        <line x1="22" y1="144" x2="92" y2="54" />
      </g>
      <g v-else-if="palette.motif === 'arc'" fill="none" :stroke="palette.ink" stroke-width="6">
        <path d="M-16 46 A 58 58 0 0 1 100 -4" />
        <path d="M-16 66 A 78 78 0 0 1 116 6" />
      </g>
      <g v-else :stroke="palette.ink" stroke-width="3">
        <line x1="12" y1="18" x2="12" y2="132" />
        <line x1="34" y1="18" x2="34" y2="132" />
        <line x1="56" y1="18" x2="56" y2="132" />
        <line x1="78" y1="18" x2="78" y2="132" />
      </g>
    </svg>

    <div class="gen-meta">
      <div class="gen-rule" />
      <div>
        <p class="gen-title">{{ title }}</p>
        <p v-if="author" class="gen-author">{{ author }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gen-cover {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  container-type: inline-size;
  background-image: linear-gradient(145deg, var(--from), var(--to));
}
.gen-motif {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  opacity: 0.26;
}
.gen-meta {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 9cqw;
  color: var(--ink);
}
.gen-rule {
  height: 3cqw;
  width: 22cqw;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.85;
}
.gen-title {
  font-size: 12.5cqw;
  line-height: 1.06;
  font-weight: 700;
  letter-spacing: -0.015em;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.gen-author {
  margin-top: 4cqw;
  font-size: 6.2cqw;
  font-weight: 500;
  opacity: 0.82;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
