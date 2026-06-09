/**
 * Minimal HS256 JWT (no external dep). Security choices that matter:
 *  - Fixed algorithm: we always HMAC-verify with our secret and never trust the
 *    token's `alg` header → no algorithm-confusion attack.
 *  - Constant-time signature compare (timingSafeEqual).
 *  - `kind` claim distinguishes a short-lived magic-link token from a session
 *    token, so one can never be used as the other.
 *
 * Set AUTH_SECRET in every real environment. A dev fallback keeps the sandbox
 * working but is logged as insecure.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "dev-insecure-secret-change-me";
function secret(): string {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === "production") console.warn("AUTH_SECRET unset — using an INSECURE dev secret.");
    return DEV_SECRET;
  }
  return s;
}

const b64 = (buf: Buffer): string => buf.toString("base64url");
const now = (): number => Math.floor(Date.now() / 1000);

type Claims = Record<string, unknown> & { kind: "session" | "magic"; exp: number; iat: number };

function sign(payload: Record<string, unknown>, kind: "session" | "magic", ttlSec: number): string {
  const header = b64(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64(Buffer.from(JSON.stringify({ ...payload, kind, iat: now(), exp: now() + ttlSec })));
  const data = `${header}.${body}`;
  const sig = b64(createHmac("sha256", secret()).update(data).digest());
  return `${data}.${sig}`;
}

function verify(token: string, kind: "session" | "magic"): Claims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = b64(createHmac("sha256", secret()).update(data).digest());
  const got = Buffer.from(parts[2]);
  const exp = Buffer.from(expected);
  if (got.length !== exp.length || !timingSafeEqual(got, exp)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Claims;
    if (claims.kind !== kind) return null;
    if (typeof claims.exp !== "number" || claims.exp < now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export type SessionClaims = { orgId: string; userId: string; email: string };

export const SESSION_TTL = 7 * 24 * 3600; // 7 days
export const MAGIC_TTL = 15 * 60; // 15 minutes

export function signSession(c: SessionClaims): string {
  return sign(c, "session", SESSION_TTL);
}
export function verifySession(token: string): SessionClaims | null {
  const c = verify(token, "session");
  if (!c || typeof c.orgId !== "string" || typeof c.userId !== "string" || typeof c.email !== "string") return null;
  return { orgId: c.orgId, userId: c.userId, email: c.email };
}
export function signMagic(email: string): string {
  return sign({ email }, "magic", MAGIC_TTL);
}
export function verifyMagic(token: string): string | null {
  const c = verify(token, "magic");
  return c && typeof c.email === "string" ? c.email : null;
}
