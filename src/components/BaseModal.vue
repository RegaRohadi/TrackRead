<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { PhX } from "@phosphor-icons/vue";

const props = defineProps<{
  show: boolean;
  title?: string;
  closeOnOverlay?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const closeOnOverlay = props.closeOnOverlay ?? true;

const dragY = ref(0);
const dragging = ref(false);
const snapping = ref(false);
let startY = 0;
let startT = 0;

function onDragStart(e: PointerEvent) {
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) return;
  dragging.value = true;
  snapping.value = false;
  startY = e.clientY;
  startT = Date.now();
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
}

function onDragMove(e: PointerEvent) {
  if (!dragging.value) return;
  dragY.value = Math.max(0, e.clientY - startY);
}

function onDragEnd() {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  if (!dragging.value) return;
  dragging.value = false;
  const velocity = dragY.value / Math.max(1, Date.now() - startT);
  snapping.value = true;
  if (dragY.value > 120 || velocity > 0.5) {
    dragY.value = typeof window !== "undefined" ? window.innerHeight : 800;
    window.setTimeout(() => {
      dragY.value = 0;
      snapping.value = false;
      emit("close");
    }, 200);
  } else {
    dragY.value = 0;
    window.setTimeout(() => (snapping.value = false), 260);
  }
}

function sheetStyle() {
  if (dragY.value > 0 || snapping.value) {
    return {
      transform: `translateY(${dragY.value}px)`,
      transition: dragging.value ? "none" : "transform 220ms var(--ease-out-quint)",
    };
  }
  return undefined;
}

function handleOverlayClick() {
  if (closeOnOverlay) emit("close");
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && props.show) emit("close");
}

watch(
  () => props.show,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (!isOpen) {
      dragY.value = 0;
      dragging.value = false;
      snapping.value = false;
    }
  }
);

onMounted(() => window.addEventListener("keydown", handleEscape));
onUnmounted(() => {
  window.removeEventListener("keydown", handleEscape);
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        @click.self="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="translate-y-6 opacity-0 sm:translate-y-2"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-6 opacity-0 sm:translate-y-2"
        >
          <div
            v-if="show"
            class="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[16px] bg-card pb-[env(safe-area-inset-bottom)] sm:rounded-[16px]"
            role="dialog"
            aria-modal="true"
            :style="sheetStyle()"
          >
            <div
              class="flex shrink-0 touch-none justify-center pt-2 pb-1 sm:hidden"
              role="presentation"
              @pointerdown="onDragStart"
            >
              <span class="h-1 w-9 rounded-full bg-gray3" />
            </div>
            <div
              class="relative flex h-12 shrink-0 touch-none items-center justify-center border-b border-sep px-12"
              @pointerdown="onDragStart"
            >
              <h2 v-if="title" class="truncate text-[17px] font-semibold text-label">{{ title }}</h2>
              <button
                class="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-fill text-label2 transition-colors active:opacity-70 lg:h-8 lg:w-8"
                aria-label="Tutup"
                @pointerdown.stop
                @click="emit('close')"
              >
                <PhX :size="15" weight="bold" />
              </button>
            </div>

            <div class="overflow-y-auto p-5">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex justify-end gap-2 border-t border-sep px-5 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
