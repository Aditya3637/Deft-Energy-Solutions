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
const SESSION_MAXAGE = 7 * 24 * 3600;

/** Mirror the token into a cookie so Vercel SSR can read it (localStorage is
 * client-only). Not httpOnly — the token is already in localStorage; a route
 * handler could set an httpOnly cookie later for extra hardening. */
function writeCookie(token: string | null): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = token
    ? `${SESSION_KEY}=${token}; path=/; max-age=${SESSION_MAXAGE}; SameSite=Lax${secure}`
    : `${SESSION_KEY}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, token);
  writeCookie(token);
}
export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  writeCookie(null);
}

/**
 * Server-side (Vercel SSR only): read the session token from the request cookie
 * so server-rendered pages are scoped to the signed-in org. `next/headers` is
 * loaded via a variable-specifier dynamic import (webpackIgnore) so it is NEVER
 * bundled into the client or the static Pages export, and is only reached when
 * `process.env.VERCEL` is set — so the static build never invokes `cookies()`.
 */
async function serverCookieToken(): Promise<string | null> {
  try {
    const spec = "next/headers";
    const mod = (await import(/* webpackIgnore: true */ spec)) as typeof import("next/headers");
    const store = await mod.cookies();
    return store.get(SESSION_KEY)?.value ?? null;
  } catch {
    return null;
  }
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

/** Thrown on a non-2xx response, carrying the status + parsed body so callers
 *  can react to specific cases (e.g. 402 plan-limit → show an upgrade prompt). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  if (!base) throw new Error("API not configured (NEXT_PUBLIC_API_URL unset)");
  // Client → localStorage token; Vercel SSR → request cookie (so server-rendered
  // pages are scoped to the signed-in org). Static Pages build: VERCEL unset →
  // never touches cookies(), stays anonymous/demo.
  let token = getSessionToken();
  if (!token && typeof window === "undefined" && process.env.VERCEL) {
    token = await serverCookieToken();
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(`API ${res.status} ${res.statusText} for ${path}`, res.status, body);
  }
  return (await res.json()) as T;
}
