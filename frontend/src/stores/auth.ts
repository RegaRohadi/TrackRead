import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import api from '@/services/api';
import type { User } from '@/types/user';

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(typeof window !== 'undefined' ? window.localStorage.getItem('token') : null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  const setAuth = (authUser: User | null, authToken: string | null) => {
    user.value = authUser;
    token.value = authToken;

    if (typeof window !== 'undefined') {
      if (authToken) {
        window.localStorage.setItem('token', authToken);
      } else {
        window.localStorage.removeItem('token');
      }
    }
  };

  const initialize = async () => {
    if (!token.value) {
      return;
    }

    try {
      const response = await api.get<User>('/auth/me');
      user.value = response.data;
    } catch {
      setAuth(null, null);
    }
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      return response.data;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || 'Login gagal.';
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setAuth(response.data.user, response.data.token);
      return response.data;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || 'Registrasi gagal.';
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/auth/logout');
      }
    } catch {
      // abaikan error logout
    } finally {
      setAuth(null, null);
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
  };
});
