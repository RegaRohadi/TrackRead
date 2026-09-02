<script setup lang="ts">
interface Props {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: "button",
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-1.5 rounded-[0.25rem] border font-medium transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-50 dark:focus-visible:ring-offset-base-950',
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',

      variant === 'primary' &&
        'border-terra-700 bg-terra-700 text-white hover:bg-terra-800',
      variant === 'secondary' &&
        'border-base-300 bg-white text-base-700 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-200 dark:hover:bg-base-800',
      variant === 'ghost' &&
        'border-transparent bg-transparent text-terra-700 hover:bg-terra-50 dark:text-terra-400 dark:hover:bg-terra-950',
      variant === 'danger' &&
        'border-red-700 bg-red-700 text-white hover:bg-red-800',

      (disabled || loading) && 'cursor-not-allowed opacity-50'
    ]"
  >
    <slot />
  </button>
</template>
