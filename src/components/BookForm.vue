<script setup lang="ts">
import { watch } from "vue";
import { PhMagicWand } from "@phosphor-icons/vue";
import BaseInput from "@/components/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseImageInput from "@/components/BaseImageInput.vue";
import StatusSelect from "@/components/StatusSelect.vue";
import type { Book, ReadingStatus } from "@/types/book";
interface Props { form: Book; isEdit: boolean; isSubmitting: boolean; coverPreviewUrl?: string | null; coverFile?: File | null; isFetchingCover?: boolean; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: "submit"): void; (e: "cancel"): void; (e: "open-lookup"): void; (e: "cover-change", file: File | null): void }>();
function parseNumberValue(value: string | number | null | undefined) { if (value === null || value === undefined || value === "") return null; const parsed = Number(value); return Number.isNaN(parsed) ? null : parsed; }
function onCoverChange(file: File | null) { emit("cover-change", file); }
function onStatusChange(value: ReadingStatus) { props.form.status = value; }
watch(() => props.form.pages_read, (newVal) => { if (newVal && props.form.pages && newVal >= props.form.pages) props.form.status = "finished"; else if (newVal && newVal > 0 && props.form.status === "to_read") props.form.status = "currently_reading"; });
</script>
<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-[20px] font-bold tracking-[-0.01em] text-label">{{ isEdit ? "Edit Buku" : "Buku Baru" }}</h3>
      <button type="button" @click="emit('open-lookup')" class="tap-expand inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-blue-text active:opacity-70">
        <PhMagicWand :size="14" weight="fill" /> Auto-Isi
      </button>
    </div>
    <form class="space-y-1" @submit.prevent="emit('submit')">
      <BaseInput label="Nama Buku" required v-model="form.name" placeholder="Masukkan judul buku" />
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div class="mb-4">
          <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Status Membaca</label>
          <StatusSelect full :model-value="form.status ?? 'to_read'" @update:model-value="onStatusChange" />
        </div>
        <BaseInput label="Genre" v-model="form.genre" placeholder="Ex: Programming" />
      </div>
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <BaseInput label="Author" v-model="form.author" placeholder="Ex: Robert C. Martin" />
        <BaseInput label="Publisher" v-model="form.publisher" placeholder="Ex: Prentice Hall" />
      </div>
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <BaseInput label="Tanggal Rilis" type="date" v-model="form.release_date" />
        <BaseInput label="Jumlah Halaman" type="number" :modelValue="String(form.pages ?? '')" placeholder="Contoh: 320" @update:modelValue="(value) => (form.pages = parseNumberValue(value))" />
      </div>
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <BaseInput label="Halaman Selesai Dibaca" type="number" :modelValue="String(form.pages_read ?? '')" placeholder="Contoh: 120" @update:modelValue="(value) => (form.pages_read = parseNumberValue(value))" />
        <div class="mb-4 flex items-end px-1 pb-1 text-[13px] text-label2">Progress PDF/EPUB tersimpan otomatis di Reader.</div>
      </div>
      <BaseInput label="Deskripsi / Sinopsis" v-model="form.description" placeholder="Deskripsi ringkas buku" />
      <div class="mb-4">
        <div v-if="isFetchingCover" class="mb-2 flex items-center gap-2 px-1 text-[13px] text-blue-text"><span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue border-t-transparent"></span> Mengunduh cover...</div>
        <BaseImageInput :existingUrl="coverPreviewUrl" :modelValue="coverFile" @update:modelValue="onCoverChange" />
        <p v-if="form.has_file || form.has_pdf" class="mt-2 px-1 text-[13px] text-label2">Buku ini memiliki {{ form.file_type === "epub" ? "EPUB" : "PDF" }} ({{ form.pdf_total_pages ?? form.pages }} hal).</p>
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <BaseButton variant="secondary" @click="emit('cancel')">Batal</BaseButton>
        <BaseButton type="submit" :disabled="isSubmitting || isFetchingCover" :loading="isSubmitting"><span v-if="isFetchingCover">Menyiapkan...</span><span v-else>{{ isEdit ? "Simpan" : "Tambah" }}</span></BaseButton>
      </div>
    </form>
  </div>
</template>
