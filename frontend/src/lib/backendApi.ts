const TEST_FALLBACK_BACKEND = "http://localhost:8000";

function normalizeApiBase(rawBase: string): string {
  const trimmed = rawBase.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/api")) {
    return trimmed;
  }
  return `${trimmed}/api`;
}

export function resolveBackendApiBase(): string {
  const env = process.env.NEXT_PUBLIC_TINGLE_ENV ?? "product";
  const rawBase =
    env === "test"
      ? process.env.NEXT_PUBLIC_BACKEND_URL_TEST ?? TEST_FALLBACK_BACKEND
      : process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  return normalizeApiBase(rawBase);
}

