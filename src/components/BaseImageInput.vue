<script setup lang="ts">
import { ref } from "vue";

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
    <label class="mb-2 block text-sm font-medium text-gray-700">
      Cover Buku
    </label>

    <!-- Preview state -->
    <div v-if="previewUrl" class="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <img
        :src="previewUrl"
        alt="Preview cover"
        class="h-24 w-16 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
      >

      <div class="flex flex-1 flex-col gap-2 min-w-0">
        <p class="truncate text-sm font-medium text-gray-700">
          {{ modelValue?.name ?? "Cover saat ini" }}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-300 transition-colors hover:bg-gray-100"
            @click="fileInput?.click()"
          >
            Ganti
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
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
      class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors"
      :class="isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>

      <p class="text-sm text-gray-600">
        <span class="font-medium text-blue-600">Klik untuk upload</span> atau drag & drop
      </p>
      <p class="text-xs text-gray-400">PNG, JPG hingga {{ MAX_SIZE_MB }}MB</p>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onCoverChange"
      >
    </label>

    <p v-if="error" class="mt-2 text-xs text-red-600">
      {{ error }}
    </p>
  </div>
</template>
