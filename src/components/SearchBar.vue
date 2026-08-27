<template>
  <form
    @submit.prevent="submitSearch"
    class="flex items-center gap-2 w-full max-w-md px-3 py-2 bg-white border border-gray-300 rounded-full transition-colors focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100"
  >
    <svg
      class="w-[18px] h-[18px] text-gray-400 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>

    <input
      ref="inputRef"
      v-model="query"
      type="text"
      class="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
      :placeholder="placeholder"
      @keydown.esc="clearQuery"
    />

    <button
      type="submit"
      class="text-gray-500 hover:text-gray-700 text-sm font-medium px-2"
      aria-label="Submit search"
    >
      Cari
    </button>

    <button
      v-if="query"
      type="button"
      class="text-gray-400 hover:text-gray-600 text-lg leading-none px-0.5"
      aria-label="Clear search"
      @click="clearQuery"
    >
      ×
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Cari sesuatu...'
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

const query = ref(props.modelValue)
const inputRef = ref(null)

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
