<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
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
  }
);

onMounted(() => window.addEventListener("keydown", handleEscape));
onUnmounted(() => {
  window.removeEventListener("keydown", handleEscape);
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
          >
            <div class="relative flex h-12 shrink-0 items-center justify-center border-b border-sep px-12">
              <h2 v-if="title" class="truncate text-[17px] font-semibold text-label">{{ title }}</h2>
              <button
                class="absolute right-2 grid h-8 w-8 place-items-center rounded-full bg-fill text-label2 transition-colors active:opacity-70"
                aria-label="Tutup"
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
