<script setup lang="ts">
interface Props {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: "button",
  variant: "primary",
  disabled: false,
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'px-4 py-2 rounded-lg font-medium transition duration-200',

      variant === 'primary' &&
        'bg-indigo-600 text-white hover:bg-indigo-700',

      variant === 'secondary' &&
        'bg-gray-200 text-gray-700 hover:bg-gray-300',

      variant === 'danger' &&
        'bg-red-600 text-white hover:bg-red-700',

      disabled &&
        'opacity-50 cursor-not-allowed'
    ]"
  >
    <slot />
  </button>
</template>
