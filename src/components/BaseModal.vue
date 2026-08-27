<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

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

// Prevent background scroll when modal is open
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
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="show"
            class="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <div
              class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white/90 backdrop-blur px-6 py-4"
            >
              <h2
                v-if="title"
                class="text-lg font-semibold text-gray-900 truncate"
              >
                {{ title }}
              </h2>
              <span v-else />

              <button
                class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close"
                @click="emit('close')"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <slot />
            </div>

            <!-- Footer (optional) -->
            <div
              v-if="$slots.footer"
              class="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white/90 backdrop-blur px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
