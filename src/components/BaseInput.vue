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
      class="mb-1.5 block px-1 text-[13px] font-medium text-label2"
    >
      {{ label }}<span v-if="required" class="text-red"> *</span>
    </label>

    <input
      :type="type"
      :value="String(modelValue)"
      :placeholder="placeholder"
      :required="required"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full rounded-[10px] bg-fill px-3.5 py-2.5 text-[16px] text-label transition-shadow placeholder:text-label3 focus:outline-none focus:ring-2 focus:ring-blue"
    />

    <p v-if="error" class="mt-1 px-1 text-[13px] text-red">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 px-1 text-[13px] text-label2">{{ hint }}</p>
  </div>
</template>
