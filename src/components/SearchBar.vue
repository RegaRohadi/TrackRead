<template>
  <form
    @submit.prevent="submitSearch"
    class="flex items-center gap-2 w-full max-w-md px-3 py-2 bg-white border border-base-300 rounded-[0.25rem] transition-colors focus-within:border-terra-600 focus-within:ring-1 focus-within:ring-terra-600 dark:bg-base-900 dark:border-base-700"
  >
    <PhMagnifyingGlass :size="16" class="text-base-400 flex-shrink-0" weight="regular" />

    <input
      ref="inputRef"
      v-model="query"
      type="text"
      class="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-base-800 placeholder:text-base-400 dark:text-base-100 dark:placeholder:text-base-500"
      :placeholder="placeholder"
      @keydown.esc="clearQuery"
    />

    <button
      type="submit"
      class="text-terra-700 hover:text-terra-800 text-xs font-medium px-2 py-0.5 hover:bg-terra-50 transition-colors dark:text-terra-400 dark:hover:text-terra-300 dark:hover:bg-terra-950"
      aria-label="Cari buku"
    >
      Cari
    </button>

    <button
      v-if="query"
      type="button"
      class="text-base-400 hover:text-base-600 dark:text-base-500 dark:hover:text-base-300 transition-colors p-0.5"
      aria-label="Hapus pencarian"
      @click="clearQuery"
    >
      <PhX :size="14" weight="bold" />
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { PhMagnifyingGlass, PhX } from '@phosphor-icons/vue';

interface Props {
  placeholder?: string
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Cari sesuatu...',
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
  (e: 'clear'): void
}>()

const query = ref(props.modelValue)
const inputRef = ref<HTMLInputElement | null>(null)

watch(query, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== query.value) query.value = newVal
  }
)

function submitSearch() {
  emit('search', query.value)
}

function clearQuery() {
  query.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}
</script>
