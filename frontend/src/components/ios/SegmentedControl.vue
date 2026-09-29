<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}

defineProps<{
  modelValue: string;
  options: Option[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="flex gap-0.5 rounded-[9px] bg-fill p-0.5">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="tap-expand flex min-h-11 flex-1 items-center justify-center rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors lg:min-h-0"
      :class="option.value === modelValue ? 'bg-card text-label shadow-sm' : 'text-label2 hover:text-label'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
