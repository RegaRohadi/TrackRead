import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BookList from '@/views/BookList.vue';
import AuthPage from '@/views/AuthPage.vue';
import LandingView from '@/views/LandingView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/auth', name: 'auth', component: AuthPage },
    { path: '/library', name: 'books', component: BookList, meta: { requiresAuth: true } },
    { path: '/reader/:id', name: 'reader', component: () => import('@/views/ReaderView.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) { next({ name: 'auth' }); return; }
  if (to.name === 'auth' && authStore.isAuthenticated) { next({ name: 'books' }); return; }
  next();
});

export default router;
