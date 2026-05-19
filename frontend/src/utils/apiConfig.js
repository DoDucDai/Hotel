const DEFAULT_API_BASE_URL = "http://localhost:8080";

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return DEFAULT_API_BASE_URL;
  }

  return value.trim().replace(/\/+$/, "") || DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = normalizeBaseUrl(import.meta?.env?.VITE_API_BASE_URL);
