const PRODUCTION_API_FALLBACK =
  "https://api-production-d32c.up.railway.app";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_API_FALLBACK
    : "http://localhost:8000");

export function getApiBaseUrl(): string {
  return API_BASE.replace(/\/$/, "");
}
