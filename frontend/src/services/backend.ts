const BACKEND_PORT = "8001";

const FALLBACK_API_BASE = `http://localhost:${BACKEND_PORT}/api/v1`;
const FALLBACK_STORAGE_BASE = `http://localhost:${BACKEND_PORT}/storage`;

function currentOrigin(): string | null {
  if (typeof window === "undefined" || !window.location.hostname) return null;
  return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
}

function configured(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export const apiBaseUrl =
  configured(import.meta.env.VITE_API_BASE_URL) ??
  (currentOrigin() ? `${currentOrigin()}/api/v1` : FALLBACK_API_BASE);

export const storageBaseUrl =
  configured(import.meta.env.VITE_STORAGE_BASE_URL) ??
  (currentOrigin() ? `${currentOrigin()}/storage` : FALLBACK_STORAGE_BASE);
