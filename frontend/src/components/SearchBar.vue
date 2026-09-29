<template>
  <form
    @submit.prevent="submitSearch"
    class="flex w-full items-center gap-2 rounded-[10px] bg-fill px-2.5 py-2"
  >
    <PhMagnifyingGlass :size="17" class="shrink-0 text-label2" weight="bold" />

    <input
      ref="inputRef"
      v-model="query"
      type="search"
      class="min-w-0 flex-1 border-none bg-transparent text-[16px] text-label outline-none placeholder:text-label3"
      :placeholder="placeholder"
      @keydown.esc="clearQuery"
    />

    <button
      v-if="query"
      type="button"
      class="tap-expand shrink-0 text-label3 transition-colors active:opacity-60"
      aria-label="Hapus pencarian"
      @click="clearQuery"
    >
      <PhXCircle :size="17" weight="fill" />
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { PhMagnifyingGlass, PhXCircle } from "@phosphor-icons/vue";

interface Props {
  placeholder?: string;
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Cari sesuatu...",
  modelValue: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", value: string): void;
  (e: "clear"): void;
}>();

const query = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);

watch(query, (newVal) => {
  emit("update:modelValue", newVal);
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== query.value) query.value = newVal;
  }
);

function submitSearch() {
  emit("search", query.value);
}

function clearQuery() {
  query.value = "";
  emit("update:modelValue", "");
  emit("clear");
  inputRef.value?.focus();
}
</script>
