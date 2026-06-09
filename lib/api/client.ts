/**
 * HTTP client for the live backend (Stage F). Reads `NEXT_PUBLIC_API_URL` —
 * when it's set, `api.*` functions can call the real server; when it's unset
 * (the default for the static Pages demo) they return fixtures. Same signatures
 * either way, so call sites never change.
 *
 * NOTE: the Pages build is a static export, so only CLIENT-side actions can hit
 * a live API at runtime. Server-component pages bake their data at build time
 * and stay on fixtures until the backend reaches data parity / a non-static host.
 */

const SESSION_KEY = "deft_session";

/** Verified session token (set on login). Client-side only (localStorage). */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
export function setSessionToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, token);
}
export function clearSessionToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBase().length > 0;
}

/** True only when rendering server-side on Vercel with an API URL configured. */
export function liveServer(): boolean {
  return !!process.env.VERCEL && isApiConfigured();
}

/** Per-request (uncached) fetch options for live SSR reads. */
export const NO_STORE = { cache: "no-store" as const };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  if (!base) throw new Error("API not configured (NEXT_PUBLIC_API_URL unset)");
  const token = getSessionToken(); // client-side only; SSR is anonymous (→ demo org)
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return (await res.json()) as T;
}
