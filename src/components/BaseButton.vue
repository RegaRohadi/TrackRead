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
      'inline-flex items-center justify-center gap-1.5 font-semibold transition-colors',
      size === 'sm' ? 'rounded-[8px] px-3 py-1.5 text-[13px]' : 'rounded-[10px] px-4 py-2.5 text-[15px]',

      variant === 'primary' && 'bg-blue text-white active:opacity-80',
      variant === 'secondary' && 'bg-fill text-blue-text active:opacity-70',
      variant === 'ghost' && 'text-blue-text active:opacity-60',
      variant === 'danger' && 'text-red-text active:opacity-60',

      (disabled || loading) && 'cursor-not-allowed opacity-40'
    ]"
  >
    <span
      v-if="loading"
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
