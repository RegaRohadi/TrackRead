<script setup lang="ts">
import { watch } from "vue";
import { PhMagicWand } from "@phosphor-icons/vue";
import BaseInput from "@/components/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseImageInput from "@/components/BaseImageInput.vue";
import type { Book } from "@/types/book";
interface Props { form: Book; isEdit: boolean; isSubmitting: boolean; coverPreviewUrl?: string | null; coverFile?: File | null; isFetchingCover?: boolean; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: "submit"): void; (e: "cancel"): void; (e: "open-lookup"): void; (e: "cover-change", file: File | null): void }>();
function parseNumberValue(value: string | number | null | undefined) { if (value === null || value === undefined || value === "") return null; const parsed = Number(value); return Number.isNaN(parsed) ? null : parsed; }
function onCoverChange(file: File | null) { emit("cover-change", file); }
watch(() => props.form.pages_read, (newVal) => { if (newVal && props.form.pages && newVal >= props.form.pages) props.form.status = "finished"; else if (newVal && newVal > 0 && props.form.status === "to_read") props.form.status = "currently_reading"; });
</script>
<template>
  <div>
    <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-2xl font-bold text-base-900 dark:text-base-100">{{ isEdit ? "Edit Buku" : "Tambah Buku Baru" }}</h2>
      <button type="button" @click="emit('open-lookup')" class="inline-flex items-center gap-1.5 border border-base-300 bg-white px-3 py-1.5 text-xs font-medium text-base-700 transition-colors hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200"> <PhMagicWand :size="14" weight="duotone" class="text-terra-600" /> Auto-Fill Google Books / OpenLibrary </button>
    </div>
    <form class="space-y-4" @submit.prevent="emit('submit')">
      <BaseInput label="Nama Buku" required v-model="form.name" placeholder="Masukkan judul buku" />
      <div class="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
        <div><label class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300">Status Membaca</label>
          <select v-model="form.status" class="w-full rounded-[0.25rem] border border-base-300 bg-white px-3 py-2 text-sm font-medium text-base-800 focus:border-terra-600 focus:outline-none focus:ring-1 focus:ring-terra-600 dark:border-base-700 dark:bg-base-900 dark:text-base-100">
            <option value="to_read">Ingin Dibaca</option><option value="currently_reading">Sedang Dibaca</option><option value="finished">Selesai</option><option value="dropped">Berhenti</option>
          </select>
        </div>
        <BaseInput label="Genre" v-model="form.genre" placeholder="Ex: Programming, Self-Help" />
      </div>
      <div class="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
        <BaseInput label="Author" v-model="form.author" placeholder="Ex: Robert C. Martin" />
        <BaseInput label="Publisher" v-model="form.publisher" placeholder="Ex: Prentice Hall" />
      </div>
      <div class="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
        <BaseInput label="Tanggal Rilis" type="date" v-model="form.release_date" />
        <BaseInput label="Jumlah Halaman" type="number" :modelValue="String(form.pages ?? '')" placeholder="Contoh: 320" @update:modelValue="(value) => (form.pages = parseNumberValue(value))" />
      </div>
      <div class="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
        <BaseInput label="Halaman Selesai Dibaca" type="number" :modelValue="String(form.pages_read ?? '')" placeholder="Contoh: 120" @update:modelValue="(value) => (form.pages_read = parseNumberValue(value))" />
        <div class="flex items-end pb-1 text-xs text-base-400">Progress PDF disimpan otomatis di Reader (halaman).</div>
      </div>
      <BaseInput label="Deskripsi / Sinopsis" v-model="form.description" placeholder="Deskripsi ringkas buku" />
      <div class="mb-4">
        <div v-if="isFetchingCover" class="mb-2 flex items-center gap-2 text-xs text-terra-600 dark:text-terra-400"><span class="h-3 w-3 animate-spin rounded-full border border-terra-600 border-t-transparent"></span> Mengunduh cover...</div>
        <BaseImageInput :existingUrl="coverPreviewUrl" :modelValue="coverFile" @update:modelValue="onCoverChange" />
        <p v-if="form.has_pdf" class="mt-2 text-xs text-emerald-600">Buku ini memiliki PDF ({{ form.pdf_total_pages ?? form.pages }} hal) — buka di Reader untuk melanjutkan.</p>
      </div>
      <div class="flex justify-end gap-3 border-t border-base-100 pt-4 dark:border-base-800">
        <BaseButton variant="secondary" @click="emit('cancel')">Batal</BaseButton>
        <BaseButton type="submit" :disabled="isSubmitting || isFetchingCover"><span v-if="isFetchingCover">Menyiapkan cover...</span><span v-else-if="isSubmitting">Menyimpan...</span><span v-else>{{ isEdit ? "Update Buku" : "Simpan Buku" }}</span></BaseButton>
      </div>
    </form>
  </div>
</template>
