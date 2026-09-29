<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { PhCaretDown, PhCheck } from "@phosphor-icons/vue";
import type { ReadingStatus } from "@/types/book";

interface StatusMeta {
  value: ReadingStatus;
  label: string;
  dot: string;
  text: string;
  soft: string;
}

const STATUS_META: Record<ReadingStatus, StatusMeta> = {
  to_read: { value: "to_read", label: "Ingin Dibaca", dot: "bg-blue", text: "text-blue-text", soft: "bg-blue/12" },
  currently_reading: { value: "currently_reading", label: "Sedang Dibaca", dot: "bg-orange", text: "text-orange-text", soft: "bg-orange/12" },
  finished: { value: "finished", label: "Selesai", dot: "bg-green", text: "text-green-text", soft: "bg-green/12" },
  dropped: { value: "dropped", label: "Berhenti", dot: "bg-gray", text: "text-gray", soft: "bg-gray/15" },
};

const STATUS_LIST = Object.values(STATUS_META);

const props = withDefaults(
  defineProps<{
    modelValue?: ReadingStatus | null;
    disabled?: boolean;
    align?: "left" | "right";
    full?: boolean;
  }>(),
  {
    modelValue: "to_read",
    disabled: false,
    align: "left",
    full: false,
  },
);

const emit = defineEmits<{ (e: "update:modelValue", value: ReadingStatus): void }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const current = computed(() => STATUS_META[props.modelValue ?? "to_read"]);

function choose(value: ReadingStatus) {
  open.value = false;
  if (value !== props.modelValue) emit("update:modelValue", value);
}

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <div ref="root" class="relative" :class="full ? 'block w-full' : 'inline-block'">
    <button
      type="button"
      class="tap-expand flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[14px] font-semibold transition-colors disabled:opacity-50"
      :class="[current.soft, current.text, full ? 'w-full justify-between' : '']"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :disabled="disabled"
      @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="current.dot" />
        <span class="truncate">{{ current.label }}</span>
      </span>
      <PhCaretDown :size="13" weight="bold" class="shrink-0 transition-transform duration-200" :class="open ? 'rotate-180' : ''" />
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="absolute z-50 mt-1.5 w-48 origin-top overflow-hidden rounded-[12px] border border-sep bg-card p-1 shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
        :class="align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'"
        role="listbox"
      >
        <button
          v-for="option in STATUS_LIST"
          :key="option.value"
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-left text-[14px] transition-colors active:bg-fill"
          :class="option.value === current.value ? 'font-semibold' : 'text-label'"
          role="option"
          :aria-selected="option.value === current.value"
          @click="choose(option.value)"
        >
          <span class="flex min-w-0 items-center gap-2" :class="option.value === current.value ? option.text : 'text-label'">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="option.dot" />
            <span class="truncate">{{ option.label }}</span>
          </span>
          <PhCheck v-if="option.value === current.value" :size="15" weight="bold" class="shrink-0" :class="option.text" />
        </button>
      </div>
    </Transition>
  </div>
</template>
