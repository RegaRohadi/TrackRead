<script setup lang="ts">
import { ref, watch } from "vue";
import { PhImageSquare } from "@phosphor-icons/vue";

const props = defineProps<{
  modelValue?: File | null;
  existingUrl?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", file: File | null): void;
}>();

const previewUrl = ref<string | null>(props.existingUrl ?? null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const error = ref<string | null>(null);

watch(
  () => props.existingUrl,
  (newUrl) => {
    if (newUrl) {
      // if previous was blob, revoke
      if (previewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = newUrl;
    } else if (!props.modelValue) {
      // only clear if no file is present
      if (previewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
  }
);

const MAX_SIZE_MB = 2;

function handleFile(file: File | undefined | null) {
  error.value = null;

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    error.value = "File harus berupa gambar.";
    return;
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    error.value = `Ukuran gambar maksimal ${MAX_SIZE_MB}MB.`;
    return;
  }

  if (previewUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
  emit("update:modelValue", file);
}

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  handleFile(file);
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  handleFile(file);
}

function removeCover() {
  if (previewUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
  error.value = null;
  emit("update:modelValue", null);
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<template>
  <div>
    <label class="mb-2 block text-sm font-medium text-base-700 dark:text-base-300">
      Cover Buku
    </label>

    <!-- Preview state -->
    <div v-if="previewUrl" class="flex items-center gap-4 border border-base-300 bg-base-50 p-4 dark:border-base-700 dark:bg-base-800">
      <img
        :src="previewUrl"
        alt="Pratinjau cover"
        class="h-24 w-16 shrink-0 border border-base-200 object-cover dark:border-base-700"
        referrerpolicy="no-referrer"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      >

      <div class="flex flex-1 flex-col gap-2 min-w-0">
        <p class="truncate text-sm font-medium text-base-700 dark:text-base-300">
          {{ modelValue?.name ?? "Cover saat ini" }}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="border border-base-300 bg-white px-3 py-1.5 text-xs font-medium text-base-700 transition-colors hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200 dark:hover:bg-base-700"
            @click="fileInput?.click()"
          >
            Ganti
          </button>
          <button
            type="button"
            class="border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:bg-base-900 dark:text-red-400 dark:hover:bg-red-950"
            @click="removeCover"
          >
            Hapus
          </button>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onCoverChange"
      >
    </div>

    <!-- Empty / dropzone state -->
    <label
      v-else
      class="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-8 text-center transition-colors"
      :class="isDragging ? 'border-terra-600 bg-terra-50 dark:bg-terra-950' : 'border-base-300 bg-base-50 hover:border-base-400 hover:bg-base-100 dark:border-base-700 dark:bg-base-800 dark:hover:bg-base-700'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <PhImageSquare :size="32" class="text-base-400 dark:text-base-500" weight="regular" />

      <p class="text-sm text-base-600 dark:text-base-300">
        <span class="font-medium text-terra-700 dark:text-terra-400">Klik untuk upload</span> atau drag & drop
      </p>
      <p class="text-xs text-base-400 dark:text-base-500">PNG, JPG hingga {{ MAX_SIZE_MB }}MB</p>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onCoverChange"
      >
    </label>

    <p v-if="error" class="mt-2 text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>
