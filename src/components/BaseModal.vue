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
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="show"
            class="relative w-full max-w-2xl rounded-[0.375rem] border border-base-200 bg-white max-h-[90vh] overflow-y-auto dark:bg-base-900 dark:border-base-800"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <div
              class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-base-200 px-6 py-4 dark:border-base-800"
            >
              <h2
                v-if="title"
                class="truncate text-lg font-semibold text-base-900 dark:text-base-100"
              >
                {{ title }}
              </h2>
              <span v-else />

              <button
                class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-base-400 transition-colors hover:bg-base-100 hover:text-base-700 focus:outline-none focus:ring-2 focus:ring-base-300 dark:text-base-500 dark:hover:bg-base-800 dark:hover:text-base-200 dark:focus:ring-base-600"
                aria-label="Tutup"
                @click="emit('close')"
              >
                <PhX :size="18" weight="bold" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <slot />
            </div>

            <!-- Footer (optional) -->
            <div
              v-if="$slots.footer"
              class="sticky bottom-0 flex justify-end gap-3 border-t border-base-200 bg-white px-6 py-4 dark:border-base-800 dark:bg-base-900"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
