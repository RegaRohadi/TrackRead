import { ref, watchEffect } from "vue";

export type Theme = "light" | "dark";

const STORAGE_KEY = "trackread_theme";

const theme = ref<Theme>(getInitial());

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

watchEffect(() => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme.value === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch {
    /* ignore storage errors */
  }
});

function setTheme(value: Theme) {
  theme.value = value;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}

export function useTheme() {
  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
