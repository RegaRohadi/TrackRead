<script setup lang="ts">
import { computed, ref, watch } from "vue";
import GeneratedCover from "./GeneratedCover.vue";

const props = defineProps<{
  cover?: string | null;
  coverUrl?: string | null;
  title: string;
  author?: string | null;
}>();

const storageBase = import.meta.env.VITE_STORAGE_BASE_URL || "http://localhost:8001/storage";
const broken = ref(false);

const imageSrc = computed<string | null>(() => {
  const cover = props.cover;
  if (cover) {
    if (/^https?:\/\//.test(cover)) return cover;
    return `${storageBase}/${cover.replace(/^\/+/, "")}`;
  }
  const url = props.coverUrl;
  if (url && /^https?:\/\//.test(url)) return url;
  return null;
});

watch(imageSrc, () => {
  broken.value = false;
});
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-gray6">
    <img
      v-if="imageSrc && !broken"
      :src="imageSrc"
      :alt="`Sampul ${title}`"
      class="h-full w-full object-cover"
      loading="lazy"
      referrerpolicy="no-referrer"
      @error="broken = true"
    />
    <GeneratedCover v-else :title="title" :author="author" />
  </div>
</template>
