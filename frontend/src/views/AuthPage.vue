<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue';

import { useAuthStore } from '@/stores/auth';
import SegmentedControl from '@/components/ios/SegmentedControl.vue';

const router = useRouter();
const authStore = useAuthStore();
const logo = "/logo-mark.png";

const showPassword = ref(false);
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
  if (!isFormValid.value) return;
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
  <div class="relative flex min-h-screen items-center justify-center bg-grouped px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center text-center">
        <img :src="logo" alt="TrackRead" class="h-20 w-20 rounded-[20px] shadow-[0_10px_28px_rgba(78,90,43,0.22)]" />
        <p class="font-logo mt-4 text-[30px] leading-none font-semibold tracking-[-0.01em]">
          <span class="text-[#4E5A2B] dark:text-[#C3CF95]">Track</span><span class="text-[#B0562C] dark:text-[#D27A4E]">Read</span>
        </p>
        <p class="mt-2 text-[11px] font-semibold tracking-[0.22em] text-[#4E5A2B]/70 uppercase dark:text-[#C3CF95]/70">Track your reading. Grow every day.</p>
      </div>
      <h1 class="sr-only">{{ isLogin ? 'Masuk' : 'Buat Akun' }}</h1>

      <SegmentedControl
        :model-value="isLogin.value ? 'masuk' : 'daftar'"
        :options="[{ value: 'masuk', label: 'Masuk' }, { value: 'daftar', label: 'Daftar' }]"
        @update:model-value="(v) => { if ((v === 'daftar') !== !isLogin.value) toggleMode(); }"
      />

      <form class="mt-5 space-y-3" @submit.prevent="submit" novalidate>
        <div v-if="!isLogin.value">
          <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Nama</label>
          <input
            v-model="form.name"
            type="text"
            autocomplete="name"
            class="w-full rounded-[10px] bg-fill px-3.5 py-3 text-[16px] text-label transition-shadow placeholder:text-label3 focus:outline-none focus:ring-2 focus:ring-blue"
            :class="touched.name && nameError ? 'ring-2 ring-red' : ''"
            placeholder="Nama lengkap"
            required
            @blur="touched.name = true"
          />
          <p v-if="touched.name && nameError" class="mt-1 px-1 text-[13px] text-red-text">{{ nameError }}</p>
        </div>

        <div>
          <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Email</label>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            inputmode="email"
            class="w-full rounded-[10px] bg-fill px-3.5 py-3 text-[16px] text-label transition-shadow placeholder:text-label3 focus:outline-none focus:ring-2 focus:ring-blue"
            :class="touched.email && emailError ? 'ring-2 ring-red' : ''"
            placeholder="email@example.com"
            required
            @blur="touched.email = true"
          />
          <p v-if="touched.email && emailError" class="mt-1 px-1 text-[13px] text-red-text">{{ emailError }}</p>
        </div>

        <div>
          <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Password</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isLogin.value ? 'current-password' : 'new-password'"
              class="w-full rounded-[10px] bg-fill py-3 pr-12 pl-3.5 text-[16px] text-label transition-shadow placeholder:text-label3 focus:outline-none focus:ring-2 focus:ring-blue"
              :class="touched.password && passwordError ? 'ring-2 ring-red' : ''"
              placeholder="Minimal 8 karakter"
              required
              @blur="touched.password = true"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 grid w-11 place-items-center text-label2 active:opacity-60"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="showPassword = !showPassword"
            >
              <PhEyeSlash v-if="showPassword" :size="19" />
              <PhEye v-else :size="19" />
            </button>
          </div>
          <p v-if="touched.password && passwordError" class="mt-1 px-1 text-[13px] text-red-text">{{ passwordError }}</p>
        </div>

        <div v-if="!isLogin.value">
          <label class="mb-1.5 block px-1 text-[13px] font-medium text-label2">Konfirmasi Password</label>
          <input
            v-model="form.passwordConfirmation"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="w-full rounded-[10px] bg-fill px-3.5 py-3 text-[16px] text-label transition-shadow placeholder:text-label3 focus:outline-none focus:ring-2 focus:ring-blue"
            :class="touched.passwordConfirmation && passwordConfirmationError ? 'ring-2 ring-red' : ''"
            placeholder="Ulangi password"
            required
            @blur="touched.passwordConfirmation = true"
          />
          <p v-if="touched.passwordConfirmation && passwordConfirmationError" class="mt-1 px-1 text-[13px] text-red-text">{{ passwordConfirmationError }}</p>
        </div>

        <p v-if="authStore.error" role="alert" class="rounded-[10px] bg-red/10 px-3 py-2 text-[13px] font-medium text-red-text">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-[12px] bg-blue px-4 py-3.5 text-[17px] font-semibold text-white transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Memproses...' : submitLabel }}
        </button>
      </form>

      <p class="mt-6 text-center text-[15px] text-label2">
        {{ toggleLabel }}
        <button class="tap-expand font-semibold text-blue-text active:opacity-60" @click="toggleMode">
          {{ isLogin.value ? 'Daftar' : 'Masuk' }}
        </button>
      </p>
    </div>
  </div>
</template>
