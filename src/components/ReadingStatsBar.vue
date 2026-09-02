<script setup lang="ts">
import { computed, ref } from "vue";
import { PhPencilSimple } from "@phosphor-icons/vue";
import type { ReadingStats } from "@/types/book";
import BaseButton from "@/components/BaseButton.vue";

const props = defineProps<{
  stats: ReadingStats | null;
  yearlyGoal: number;
}>();

const emit = defineEmits<{
  (e: "update-goal", newGoal: number): void;
}>();

const isEditingGoal = ref(false);
const goalInput = ref(props.yearlyGoal);

const finishedCount = computed(() => props.stats?.status_breakdown?.finished ?? 0);
const currentlyReadingCount = computed(() => props.stats?.status_breakdown?.currently_reading ?? 0);

const goalProgressPercent = computed(() => {
  if (!props.yearlyGoal || props.yearlyGoal <= 0) return 0;
  return Math.min(100, Math.round((finishedCount.value / props.yearlyGoal) * 100));
});

function saveGoal() {
  if (goalInput.value > 0) {
    emit("update-goal", goalInput.value);
    isEditingGoal.value = false;
  }
}

function cancelEditGoal() {
  goalInput.value = props.yearlyGoal;
  isEditingGoal.value = false;
}
</script>

<template>
  <section class="mb-10 border border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
    <div class="flex items-center justify-between border-b border-base-200 px-5 py-3 dark:border-base-800">
      <h2 class="font-display text-base font-semibold tracking-wide text-base-900 uppercase dark:text-base-100">
        Tahun ini
      </h2>
      <div class="flex items-center gap-3 text-xs text-base-400 dark:text-base-500">
        <span>{{ currentlyReadingCount }} sedang dibaca</span>
        <span class="text-base-300 dark:text-base-700">•</span>
        <span>{{ (stats?.total_pages_read ?? 0).toLocaleString("id-ID") }} hal dibaca</span>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-[auto_1fr_auto]">
      <!-- Total koleksi -->
      <div class="col-span-2 flex items-baseline gap-3 px-5 py-5 lg:col-span-1 lg:pr-8">
        <span class="font-display text-5xl font-semibold text-terra-700 dark:text-terra-400">
          {{ stats?.total_books ?? 0 }}
        </span>
        <span class="text-sm font-medium text-base-500 dark:text-base-400">
          buku<br>dalam koleksi
        </span>
      </div>

      <!-- Target -->
      <div class="flex flex-col justify-center gap-2 border-t border-base-200 px-5 py-5 lg:border-t-0 lg:border-l lg:px-8 dark:border-base-800">
        <div class="flex items-end gap-2">
          <span class="font-display text-3xl font-semibold text-base-900 dark:text-base-100">
            {{ finishedCount }}
          </span>
          <span class="pb-0.5 text-sm text-base-500 dark:text-base-400">
            dari {{ yearlyGoal }} buku selesai
          </span>
        </div>

        <div v-if="!isEditingGoal" class="mt-1">
          <div class="h-1 w-48 max-w-full bg-base-100 dark:bg-base-800">
            <div
              class="h-full bg-terra-600 transition-all duration-500"
              :style="{ width: `${goalProgressPercent}%` }"
            ></div>
          </div>
          <button
            class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-base-400 transition-colors hover:text-terra-600 dark:text-base-500 dark:hover:text-terra-400"
            @click="isEditingGoal = true"
          >
            <PhPencilSimple :size="12" weight="bold" />
            Ubah target
          </button>
        </div>

        <div v-else class="mt-1 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="500"
            v-model.number="goalInput"
            class="w-20 rounded-[0.25rem] border border-base-300 bg-base-50 px-2 py-1 text-sm font-medium text-base-800 focus:border-terra-600 focus:outline-none dark:border-base-700 dark:bg-base-800 dark:text-base-100"
            @keyup.enter="saveGoal"
          />
          <BaseButton size="sm" @click="saveGoal">Simpan</BaseButton>
          <BaseButton size="sm" variant="secondary" @click="cancelEditGoal">Batal</BaseButton>
        </div>
      </div>

      <!-- Halaman dibaca -->
      <div class="flex items-baseline gap-3 border-t border-base-200 px-5 py-5 lg:border-t-0 lg:border-l lg:px-8 dark:border-base-800">
        <span class="font-display text-3xl font-semibold text-base-900 dark:text-base-100">
          {{ (stats?.total_pages_read ?? 0).toLocaleString("id-ID") }}
        </span>
        <span class="text-sm text-base-500 dark:text-base-400">
          dari {{ (stats?.total_pages ?? 0).toLocaleString("id-ID") }} hal
        </span>
      </div>
    </div>
  </section>
</template>
