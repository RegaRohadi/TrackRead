import { ref, computed, watchEffect } from "vue";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "trackread_theme";
const media =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

const systemDark = ref(media?.matches ?? false);
media?.addEventListener?.("change", (event: MediaQueryListEvent) => {
  systemDark.value = event.matches;
});

const preference = ref<Theme>(getInitial());

function getInitial(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

const theme = computed<"light" | "dark">(() => {
  if (preference.value === "system") return systemDark.value ? "dark" : "light";
  return preference.value;
});

watchEffect(() => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme.value === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, preference.value);
  } catch {
    /* ignore storage errors */
  }
});

function setTheme(value: Theme) {
  preference.value = value;
}

function toggleTheme() {
  preference.value = theme.value === "dark" ? "light" : "dark";
}

export function useTheme() {
  return {
    theme,
    preference,
    setTheme,
    toggleTheme,
  };
}
