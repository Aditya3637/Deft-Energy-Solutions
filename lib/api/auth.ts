import {
  clearSessionToken,
  getApiBase,
  getSessionToken,
  isApiConfigured,
  setSessionToken,
} from "@/lib/api/client";

export type Me =
  | { authenticated: false }
  | { authenticated: true; email: string; orgId: string; org?: { id: string; name: string; plan: string } | null };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status}).`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) msg = Array.isArray(j.message) ? j.message[0] : j.message;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const auth = {
  configured: isApiConfigured,
  isSignedIn: (): boolean => !!getSessionToken(),

  /** Request a magic link. In dev the link/token comes back so you can continue. */
  async request(email: string): Promise<{ sent: boolean; link?: string; token?: string }> {
    return post("/v1/auth/request", { email });
  },

  /** Verify a magic token → store the session. */
  async verify(token: string): Promise<{ email: string; orgId: string }> {
    const r = await post<{ token: string; email: string; orgId: string }>("/v1/auth/verify", { token });
    setSessionToken(r.token);
    return { email: r.email, orgId: r.orgId };
  },

  async me(): Promise<Me> {
    if (!isApiConfigured() || !getSessionToken()) return { authenticated: false };
    try {
      const res = await fetch(`${getApiBase()}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${getSessionToken()}` },
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as Me;
    } catch {
      /* ignore */
    }
    return { authenticated: false };
  },

  signOut(): void {
    clearSessionToken();
  },
};
