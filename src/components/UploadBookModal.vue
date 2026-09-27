<script setup lang="ts">
import { computed, ref } from "vue";
import { PhFilePdf, PhFileZip, PhUploadSimple, PhWarning } from "@phosphor-icons/vue";
import BaseModal from "./BaseModal.vue";
import BaseButton from "./BaseButton.vue";
import BaseInput from "./BaseInput.vue";
import { bookFileType } from "@/composables/useBooks";

const props = defineProps<{ show: boolean; uploading: boolean; progress: number }>();
const emit = defineEmits<{ (e: "close"): void; (e: "upload", payload: { file: File; meta: { name: string; author: string; genre: string } }): void }>();

const file = ref<File | null>(null);
const dragOver = ref(false);
const error = ref("");
const metaName = ref("");
const metaAuthor = ref("");
const metaGenre = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const fileType = computed(() => (file.value ? bookFileType(file.value) : null));

function validate(f: File): string {
  if (!bookFileType(f)) return "File harus berformat PDF atau EPUB.";
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
  if (!metaName.value) metaName.value = f.name.replace(/\.(pdf|epub)$/i, "");
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  pickFile(e.dataTransfer?.files?.[0] ?? null);
}

function onInputChange(e: Event) {
  pickFile((e.target as HTMLInputElement).files?.[0] ?? null);
}

function doUpload() {
  if (!file.value) { error.value = "Pilih file PDF atau EPUB terlebih dahulu."; return; }
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
  <BaseModal :show="show" title="Unggah Buku" @close="close">
    <div
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
      class="flex cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-6 py-9 text-center transition-colors"
      :class="dragOver ? 'border-blue bg-blue/5' : 'border-gray3 active:bg-fill'"
    >
      <PhFilePdf :size="34" class="text-blue" weight="regular" />
      <p class="mt-2 text-[15px] font-medium text-label">Pilih PDF/EPUB atau seret ke sini</p>
      <p class="text-[13px] text-label2">PDF · EPUB · maks 50MB · privat</p>
      <input ref="fileInput" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" class="hidden" @change="onInputChange" />
    </div>

    <div v-if="file" class="mt-3 flex items-center gap-3 rounded-[10px] bg-fill px-3 py-2.5">
      <PhFileZip v-if="fileType === 'epub'" :size="20" weight="fill" class="shrink-0 text-blue" />
      <PhFilePdf v-else :size="20" weight="fill" class="shrink-0 text-blue" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px] font-medium text-label">{{ file.name }}</p>
        <p class="text-[13px] text-label2">{{ (file.size / 1024 / 1024).toFixed(2) }} MB · {{ fileType?.toUpperCase() }}</p>
      </div>
      <button class="shrink-0 text-label3 active:opacity-60" @click.stop="file = null" :disabled="uploading" aria-label="Hapus file">
        <PhWarning v-if="uploading" :size="16" />
        <span v-else class="text-[13px] font-medium">Ganti</span>
      </button>
    </div>

    <p v-if="error" class="mt-3 flex items-center gap-2 rounded-[10px] bg-red/10 px-3 py-2 text-[13px] font-medium text-red">
      <PhWarning :size="14" weight="fill" /> {{ error }}
    </p>

    <div v-if="file" class="mt-4 grid gap-x-4 sm:grid-cols-2">
      <BaseInput label="Judul" v-model="metaName" placeholder="Judul buku" />
      <BaseInput label="Penulis" v-model="metaAuthor" placeholder="Nama penulis" />
      <BaseInput label="Genre" v-model="metaGenre" placeholder="Genre" class="sm:col-span-2" />
    </div>

    <div v-if="uploading" class="mt-4">
      <div class="mb-1 flex justify-between text-[13px] text-label2"><span>Mengunggah...</span><span class="tabular-nums">{{ progress }}%</span></div>
      <div class="h-1.5 overflow-hidden rounded-full bg-gray5"><div class="h-full rounded-full bg-blue transition-all" :style="{ width: progress + '%' }"></div></div>
    </div>

    <div class="mt-5 flex justify-end gap-2">
      <BaseButton variant="secondary" @click="close" :disabled="uploading">Batal</BaseButton>
      <BaseButton @click="doUpload" :disabled="!file || uploading" :loading="uploading"><PhUploadSimple :size="15" weight="bold" /> Unggah</BaseButton>
    </div>
  </BaseModal>
</template>
