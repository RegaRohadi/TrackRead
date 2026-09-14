<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {}
);
</script>

<template>
  <section>
    <h2 v-if="title" class="px-4 pb-2 text-[20px] font-bold tracking-[-0.01em] text-label">{{ title }}</h2>
    <div class="overflow-hidden rounded-[var(--radius-md)] bg-card [&>*+*]:border-t [&>*+*]:border-sep">
      <slot />
    </div>
  </section>
</template>
