<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PhSun, PhMoon } from '@phosphor-icons/vue';

import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';

const router = useRouter();
const authStore = useAuthStore();
const { theme, toggleTheme } = useTheme();

const isLogin = reactive({ value: true });
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
});

const touched = reactive({
  name: false,
  email: false,
  password: false,
  passwordConfirmation: false,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nameError = computed(() => {
  if (isLogin.value) return '';
  if (!form.name.trim()) return 'Nama wajib diisi.';
  return '';
});

const emailError = computed(() => {
  if (!form.email) return 'Email wajib diisi.';
  if (!EMAIL_REGEX.test(form.email)) return 'Format email tidak valid.';
  return '';
});

const passwordError = computed(() => {
  if (!form.password) return 'Password wajib diisi.';
  if (form.password.length < 8) return 'Password minimal 8 karakter.';
  return '';
});

const passwordConfirmationError = computed(() => {
  if (isLogin.value) return '';
  if (!form.passwordConfirmation) return 'Konfirmasi password wajib diisi.';
  if (form.passwordConfirmation !== form.password) return 'Konfirmasi password tidak cocok.';
  return '';
});

const isFormValid = computed(() => {
  if (isLogin.value) {
    return !emailError.value && !passwordError.value;
  }
  return (
    !nameError.value &&
    !emailError.value &&
    !passwordError.value &&
    !passwordConfirmationError.value
  );
});

const submitLabel = computed(() => (isLogin.value ? 'Masuk' : 'Daftar'));
const toggleLabel = computed(() => (isLogin.value ? 'Belum punya akun?' : 'Sudah punya akun?'));

function touchAll() {
  touched.name = true;
  touched.email = true;
  touched.password = true;
  touched.passwordConfirmation = true;
}

async function submit() {
  touchAll();

  if (!isFormValid.value) {
    return;
  }

  try {
    if (isLogin.value) {
      await authStore.login(form.email, form.password);
    } else {
      await authStore.register(form.name, form.email, form.password, form.passwordConfirmation);
    }

    await router.push({ name: 'books' });
  } catch {
    // error handled by store
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value;
  touched.name = false;
  touched.email = false;
  touched.password = false;
  touched.passwordConfirmation = false;
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-base-100 px-4 py-8 transition-colors dark:bg-base-950">
    <button
      @click="toggleTheme"
      class="absolute top-5 right-5 flex h-9 w-9 items-center justify-center border border-base-300 bg-white text-base-600 transition-colors hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-300 dark:hover:bg-base-800"
      :aria-label="theme === 'dark' ? 'Mode terang' : 'Mode gelap'"
      :title="theme === 'dark' ? 'Mode terang' : 'Mode gelap'"
    >
      <PhMoon v-if="theme === 'dark'" :size="16" weight="duotone" />
      <PhSun v-else :size="16" weight="duotone" />
    </button>

    <div class="w-full max-w-md border border-base-200 bg-white p-8 dark:border-base-800 dark:bg-base-900">
      <div class="border-b border-base-200 pb-6 dark:border-base-800">
        <p class="mb-1 text-[11px] font-medium tracking-[0.2em] text-terra-700 uppercase dark:text-terra-400">
          TrackRead
        </p>
        <h1 class="font-display text-3xl font-semibold text-base-900 dark:text-base-50">
          {{ isLogin.value ? 'Masuk' : 'Buat akun' }}
        </h1>
        <p class="mt-1 text-sm text-base-500 dark:text-base-400">
          {{ isLogin.value ? 'Kelola koleksi buku Anda.' : 'Mulai melacak bacaan Anda.' }}
        </p>
      </div>

      <div class="mt-6 flex border border-base-300 dark:border-base-700">
        <button
          class="flex-1 px-3 py-2 text-sm font-medium transition-colors"
          :class="isLogin.value ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300 dark:hover:bg-base-800'"
          @click="isLogin.value = true"
        >
          Masuk
        </button>
        <button
          class="flex-1 px-3 py-2 text-sm font-medium transition-colors"
          :class="!isLogin.value ? 'bg-base-900 text-white dark:bg-base-100 dark:text-base-900' : 'text-base-600 hover:bg-base-100 dark:text-base-300 dark:hover:bg-base-800'"
          @click="isLogin.value = false"
        >
          Daftar
        </button>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="submit" novalidate>
        <div v-if="!isLogin.value">
          <label class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300">Nama</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-[0.25rem] border bg-white px-3 py-2 text-sm text-base-800 transition-colors placeholder:text-base-400 focus:outline-none dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
            :class="touched.name && nameError
              ? 'border-red-500 dark:border-red-600'
              : 'border-base-300 focus:border-terra-700 dark:border-base-700 dark:focus:border-terra-500'"
            placeholder="Nama lengkap"
            required
            @blur="touched.name = true"
          />
          <p v-if="touched.name && nameError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ nameError }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full rounded-[0.25rem] border bg-white px-3 py-2 text-sm text-base-800 transition-colors placeholder:text-base-400 focus:outline-none dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
            :class="touched.email && emailError
              ? 'border-red-500 dark:border-red-600'
              : 'border-base-300 focus:border-terra-700 dark:border-base-700 dark:focus:border-terra-500'"
            placeholder="email@example.com"
            required
            @blur="touched.email = true"
          />
          <p v-if="touched.email && emailError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ emailError }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full rounded-[0.25rem] border bg-white px-3 py-2 text-sm text-base-800 transition-colors placeholder:text-base-400 focus:outline-none dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
            :class="touched.password && passwordError
              ? 'border-red-500 dark:border-red-600'
              : 'border-base-300 focus:border-terra-700 dark:border-base-700 dark:focus:border-terra-500'"
            placeholder="Minimal 8 karakter"
            required
            @blur="touched.password = true"
          />
          <p v-if="touched.password && passwordError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ passwordError }}
          </p>
        </div>

        <div v-if="!isLogin.value">
          <label class="mb-1.5 block text-sm font-medium text-base-700 dark:text-base-300">Konfirmasi Password</label>
          <input
            v-model="form.passwordConfirmation"
            type="password"
            class="w-full rounded-[0.25rem] border bg-white px-3 py-2 text-sm text-base-800 transition-colors placeholder:text-base-400 focus:outline-none dark:bg-base-900 dark:text-base-100 dark:placeholder:text-base-500"
            :class="touched.passwordConfirmation && passwordConfirmationError
              ? 'border-red-500 dark:border-red-600'
              : 'border-base-300 focus:border-terra-700 dark:border-base-700 dark:focus:border-terra-500'"
            placeholder="Ulangi password"
            required
            @blur="touched.passwordConfirmation = true"
          />
          <p v-if="touched.passwordConfirmation && passwordConfirmationError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ passwordConfirmationError }}
          </p>
        </div>

        <p v-if="authStore.error" class="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500 dark:bg-red-950 dark:text-red-400">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          class="w-full border border-terra-700 bg-terra-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-terra-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Memproses...' : submitLabel }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-base-500 dark:text-base-400">
        {{ toggleLabel }}
        <button class="font-medium text-terra-700 hover:text-terra-800 dark:text-terra-400" @click="toggleMode">
          {{ isLogin.value ? 'Daftar sekarang' : 'Masuk sekarang' }}
        </button>
      </p>
    </div>
  </div>
</template>
