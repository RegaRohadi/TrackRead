<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

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
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-slate-900">TrackRead</h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ isLogin.value ? 'Masuk untuk mengelola koleksi buku Anda.' : 'Buat akun untuk mulai mengelola buku.' }}
        </p>
      </div>

      <div class="mt-6 flex rounded-lg border border-slate-200 p-1">
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition"
          :class="isLogin.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'"
          @click="isLogin.value = true"
        >
          Masuk
        </button>
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition"
          :class="!isLogin.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'"
          @click="isLogin.value = false"
        >
          Daftar
        </button>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="submit" novalidate>
        <div v-if="!isLogin.value">
          <label class="mb-1 block text-sm font-medium text-slate-700">Nama</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-lg border px-3 py-2 outline-none"
            :class="touched.name && nameError
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500'"
            placeholder="Nama lengkap"
            required
            @blur="touched.name = true"
          />
          <p v-if="touched.name && nameError" class="mt-1 text-xs text-red-600">
            {{ nameError }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full rounded-lg border px-3 py-2 outline-none"
            :class="touched.email && emailError
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500'"
            placeholder="email@example.com"
            required
            @blur="touched.email = true"
          />
          <p v-if="touched.email && emailError" class="mt-1 text-xs text-red-600">
            {{ emailError }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full rounded-lg border px-3 py-2 outline-none"
            :class="touched.password && passwordError
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500'"
            placeholder="Minimal 8 karakter"
            required
            @blur="touched.password = true"
          />
          <p v-if="touched.password && passwordError" class="mt-1 text-xs text-red-600">
            {{ passwordError }}
          </p>
        </div>

        <div v-if="!isLogin.value">
          <label class="mb-1 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
          <input
            v-model="form.passwordConfirmation"
            type="password"
            class="w-full rounded-lg border px-3 py-2 outline-none"
            :class="touched.passwordConfirmation && passwordConfirmationError
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500'"
            placeholder="Ulangi password"
            required
            @blur="touched.passwordConfirmation = true"
          />
          <p v-if="touched.passwordConfirmation && passwordConfirmationError" class="mt-1 text-xs text-red-600">
            {{ passwordConfirmationError }}
          </p>
        </div>

        <p v-if="authStore.error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Memproses...' : submitLabel }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-slate-500">
        {{ toggleLabel }}
        <button class="font-semibold text-blue-600" @click="toggleMode">
          {{ isLogin.value ? 'Daftar sekarang' : 'Masuk sekarang' }}
        </button>
      </p>
    </div>
  </div>
</template>
