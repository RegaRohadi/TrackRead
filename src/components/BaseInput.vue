<script setup lang="ts">
interface Props {
  label?: string;
  modelValue: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
      class="block mb-2 font-medium"
    >
      {{ label }}
    </label>

    <input
      :type="type"
      :value="String(modelValue)"
      :placeholder="placeholder"
      :required="required"
      @input="
        emit(
          'update:modelValue',
          ($event.target as HTMLInputElement).value
        )
      "
      class="w-full border rounded-lg p-2"
    />
  </div>
</template>
