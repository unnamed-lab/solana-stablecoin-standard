const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api/v1";
const ORACLE = process.env.NEXT_PUBLIC_ORACLE_URL || "http://localhost:3003";

/** Base URL of the backend (no /api/v1) for health and config. */
export function getBackendBase(): string {
  try {
    return new URL(BACKEND).origin;
  } catch {
    return "http://localhost:4000";
  }
}

/** Oracle host for display (e.g. "localhost:3003"). */
export function getOracleDisplayHost(): string {
  try {
    return new URL(ORACLE).host;
  } catch {
    return "oracle:3003";
  }
}

async function apiFetch<T>(base: string, path: string, opts?: RequestInit, includeMeta?: boolean): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.message || body?.error || `HTTP Error ${res.status}`;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("api-error", { detail: message }));
    }
    throw Object.assign(new Error(message), { status: res.status, body });
  }
  const body = await res.json() as any;
  // If it's a standard envelope, return the data part
  if (body && typeof body === "object" && body.status === "success" && "data" in body && !includeMeta) {
    return body.data as T;
  }
  return body as T;
}

/* ── Backend API ─────────────────────────────────────────────────── */
export const backendApi = {
  get: <T>(path: string) => apiFetch<T>(BACKEND, path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(BACKEND, path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(BACKEND, path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, query?: Record<string, string>) =>
    apiFetch<T>(BACKEND, `${path}${query ? "?" + new URLSearchParams(query) : ""}`, { method: "DELETE" }),
  getWithQuery: <T>(path: string, query: Record<string, string>, includeMeta?: boolean) =>
    apiFetch<T>(BACKEND, `${path}?${new URLSearchParams(query)}`, undefined, includeMeta),
};

/* ── Oracle API ──────────────────────────────────────────────────── */
export const oracleApi = {
  get: <T>(path: string) => apiFetch<T>(ORACLE, path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(ORACLE, path, { method: "POST", body: JSON.stringify(body) }),
  getWithQuery: <T>(path: string, query: Record<string, string>) =>
    apiFetch<T>(ORACLE, `${path}?${new URLSearchParams(query)}`),
};

/* ── CSV export helper ───────────────────────────────────────────── */
export function downloadCsv(path: string, query?: Record<string, string>) {
  const qs = query ? "?" + new URLSearchParams(query) : "";
  window.location.href = `${BACKEND}${path}${qs}`;
}
