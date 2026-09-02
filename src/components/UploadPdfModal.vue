<script setup lang="ts">
import { ref } from "vue";
import { PhFilePdf, PhUploadSimple, PhX, PhWarning } from "@phosphor-icons/vue";
import BaseModal from "./BaseModal.vue";
import BaseButton from "./BaseButton.vue";
import BaseInput from "./BaseInput.vue";

const props = defineProps<{ show: boolean; uploading: boolean; progress: number }>();
const emit = defineEmits<{ (e: "close"): void; (e: "upload", payload: { file: File; meta: { name: string; author: string; genre: string } }): void }>();

const file = ref<File | null>(null);
const dragOver = ref(false);
const error = ref("");
const metaName = ref("");
const metaAuthor = ref("");
const metaGenre = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

function validate(f: File): string {
  if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return "File harus berformat PDF.";
  if (f.size > 50 * 1024 * 1024) return "Ukuran file melebihi 50MB.";
  if (f.size === 0) return "File kosong.";
  return "";
}

function pickFile(f: File | null) {
  error.value = "";
  if (!f) { file.value = null; return; }
  const msg = validate(f);
  if (msg) { error.value = msg; return; }
  file.value = f;
  if (!metaName.value) metaName.value = f.name.replace(/\.pdf$/i, "");
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  const f = e.dataTransfer?.files?.[0] ?? null;
  pickFile(f);
}

function onInputChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  pickFile(f);
}

function doUpload() {
  if (!file.value) { error.value = "Pilih file PDF terlebih dahulu."; return; }
  const msg = validate(file.value);
  if (msg) { error.value = msg; return; }
  emit("upload", { file: file.value, meta: { name: metaName.value.trim(), author: metaAuthor.value.trim(), genre: metaGenre.value.trim() } });
}

function close() {
  if (props.uploading) return;
  file.value = null; error.value = ""; metaName.value = ""; metaAuthor.value = ""; metaGenre.value = "";
  emit("close");
}
</script>

<template>
  <BaseModal :show="show" @close="close">
    <div class="flex items-center justify-between">
      <h2 class="font-display text-xl font-semibold text-base-900 dark:text-base-100">Upload PDF Pribadi</h2>
      <button class="p-1 text-base-400 hover:text-base-700 dark:hover:text-base-200" @click="close" :disabled="uploading"><PhX :size="18" /></button>
    </div>
    <p class="mt-1 text-xs text-base-500 dark:text-base-400">Maks 50MB • hanya PDF • privat (hanya kamu yang bisa baca)</p>

    <div
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
      class="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[0.375rem] border-2 border-dashed px-6 py-10 text-center transition-colors"
      :class="dragOver ? 'border-terra-600 bg-terra-50 dark:bg-terra-950' : 'border-base-300 bg-base-50 hover:border-terra-300 dark:border-base-700 dark:bg-base-900'"
    >
      <PhFilePdf :size="36" weight="duotone" class="text-terra-700 dark:text-terra-400" />
      <p class="mt-2 text-sm font-medium text-base-700 dark:text-base-200">Seret PDF ke sini atau klik untuk pilih</p>
      <p class="text-xs text-base-400">PDF • hingga 50MB</p>
      <input ref="fileInput" type="file" accept="application/pdf,.pdf" class="hidden" @change="onInputChange" />
    </div>

    <div v-if="file" class="mt-4 flex items-center gap-3 rounded border border-base-200 bg-white px-3 py-2.5 dark:border-base-800 dark:bg-base-900">
      <PhFilePdf :size="20" weight="fill" class="shrink-0 text-terra-600" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-base-800 dark:text-base-100">{{ file.name }}</p>
        <p class="text-xs text-base-500">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>
      <button class="shrink-0 rounded p-1 text-base-400 hover:bg-base-100 dark:hover:bg-base-800" @click.stop="file = null" :disabled="uploading"><PhX :size="14" /></button>
    </div>

    <div v-if="error" class="mt-3 flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      <PhWarning :size="14" weight="fill" /> {{ error }}
    </div>

    <div v-if="file" class="mt-4 grid gap-3 sm:grid-cols-2">
      <BaseInput label="Judul" v-model="metaName" placeholder="Judul buku" />
      <BaseInput label="Penulis" v-model="metaAuthor" placeholder="Nama penulis" />
      <BaseInput label="Genre" v-model="metaGenre" placeholder="Genre" class="sm:col-span-2" />
    </div>

    <div v-if="uploading" class="mt-4">
      <div class="mb-1 flex justify-between text-xs text-base-500"><span>Mengupload...</span><span>{{ progress }}%</span></div>
      <div class="h-1.5 overflow-hidden rounded-full bg-base-100 dark:bg-base-800"><div class="h-full bg-terra-600 transition-all" :style="{ width: progress + '%' }"></div></div>
    </div>

    <div class="mt-6 flex justify-end gap-2 border-t border-base-100 pt-4 dark:border-base-800">
      <BaseButton variant="secondary" @click="close" :disabled="uploading">Batal</BaseButton>
      <BaseButton @click="doUpload" :disabled="!file || uploading" :loading="uploading"><PhUploadSimple :size="14" weight="bold" /> Upload</BaseButton>
    </div>
  </BaseModal>
</template>
