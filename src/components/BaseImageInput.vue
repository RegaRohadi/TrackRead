<script setup lang="ts">
import { ref, watch } from "vue";
import { PhImageSquare } from "@phosphor-icons/vue";
import BaseButton from "@/components/BaseButton.vue";

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
      if (previewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = newUrl;
    } else if (!props.modelValue) {
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
  if (previewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
  emit("update:modelValue", file);
}

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  handleFile(file);
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  handleFile(e.dataTransfer?.files?.[0]);
}

function removeCover() {
  if (previewUrl.value?.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  error.value = null;
  emit("update:modelValue", null);
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<template>
  <div>
    <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Cover Buku</label>

    <div v-if="previewUrl" class="flex items-center gap-4 rounded-[12px] bg-fill p-3">
      <img
        :src="previewUrl"
        alt="Pratinjau cover"
        class="h-24 w-16 shrink-0 rounded-[6px] object-cover"
        referrerpolicy="no-referrer"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      >
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <p class="truncate text-[15px] font-medium text-label">{{ modelValue?.name ?? "Cover saat ini" }}</p>
        <div class="flex gap-2">
          <BaseButton size="sm" variant="secondary" @click="fileInput?.click()">Ganti</BaseButton>
          <BaseButton size="sm" variant="danger" @click="removeCover">Hapus</BaseButton>
        </div>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onCoverChange">
    </div>

    <label
      v-else
      class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-6 py-8 text-center transition-colors"
      :class="isDragging ? 'border-blue bg-blue/5' : 'border-gray3 active:bg-fill'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <PhImageSquare :size="30" class="text-label3" weight="regular" />
      <p class="text-[15px] text-label"><span class="font-semibold text-blue-text">Ketuk untuk unggah</span> atau seret ke sini</p>
      <p class="text-[13px] text-label2">PNG, JPG hingga {{ MAX_SIZE_MB }}MB</p>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onCoverChange">
    </label>

    <p v-if="error" class="mt-2 px-1 text-[13px] text-red-text">{{ error }}</p>
  </div>
</template>
