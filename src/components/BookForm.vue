<script setup lang="ts">
import BaseInput from "@/components/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseImageInput from "@/components/BaseImageInput.vue";

import type { Book } from "@/types/book";

interface Props {
  form: Book;
  isEdit: boolean;
  isSubmitting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "cancel"): void;
  (e: "cover-change", file: File | null): void;
}>();

function parseNumberValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function onCoverChange(file: File | null) {
  emit("cover-change", file);
}
</script>

<template>
  <div>

    <h2 class="mb-6 text-2xl font-bold">

      {{ isEdit ? "Edit Buku" : "Tambah Buku" }}

    </h2>

    <form class="space-y-4" @submit.prevent="emit('submit')">

      <BaseInput label="Nama Buku" v-model="form.name" placeholder="Masukkan nama buku" />

      <BaseInput label="Genre" v-model="form.genre" placeholder="Ex: Programming" />

      <BaseInput label="Author" v-model="form.author" placeholder="Ex: Robert C. Martin" />

      <BaseInput label="Publisher" v-model="form.publisher" placeholder="Ex: Prentice Hall" />

      <BaseInput label="Tanggal Rilis" type="date" v-model="form.release_date" />

      <BaseInput label="ISBN" v-model="form.isbn" placeholder="Ex: 9780132350884" />

      <BaseInput
        label="Jumlah Halaman"
        type="number"
        :modelValue="String(form.pages ?? '')"
        placeholder="Contoh: 320"
        @update:modelValue="(value) => (form.pages = parseNumberValue(value))"
      />

      <BaseInput
        label="Halaman Dibaca"
        type="number"
        :modelValue="String(form.pages_read ?? '')"
        placeholder="Contoh: 120"
        @update:modelValue="(value) => (form.pages_read = parseNumberValue(value))"
      />

      <BaseInput label="Deskripsi" v-model="form.description" placeholder="Deskripsi buku" />

      <div>
        <label class="mb-2 block text-sm font-medium">
          Cover Buku
        </label>

        <BaseImageInput @update:modelValue="onCoverChange" />
      </div>

      <div class="flex justify-end gap-3 pt-4">

        <BaseButton variant="secondary" @click="emit('cancel')">
          Batal
        </BaseButton>

        <BaseButton type="submit" :disabled="isSubmitting">
          {{ isSubmitting
            ? "Menyimpan..."
            : isEdit
              ? "Update"
              : "Simpan"
          }}
        </BaseButton>

      </div>
    </form>

  </div>
</template>
