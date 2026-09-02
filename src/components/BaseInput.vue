<script setup lang="ts">
interface Props {
  label?: string;
  modelValue: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  type: "text",
  required: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="mb-4">
    <label
      v-if="label"
      class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300"
    >
      {{ label }}
      <span v-if="required" class="text-terra-600">*</span>
    </label>

    <input
      :type="type"
      :value="String(modelValue)"
      :placeholder="placeholder"
      :required="required"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full rounded-[0.25rem] border border-base-300 bg-white px-3 py-2 text-sm text-base-800 transition-colors placeholder:text-base-400 focus:border-terra-600 focus:outline-none focus:ring-1 focus:ring-terra-600 dark:border-base-700 dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
    />

    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-base-400 dark:text-base-500">{{ hint }}</p>
  </div>
</template>
