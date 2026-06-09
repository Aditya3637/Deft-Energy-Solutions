import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { DEMO_ORG_ID } from "./constants";
import { verifySession, type SessionClaims } from "../auth/jwt";

/** Verified session from the Bearer token, or null (anonymous). */
function sessionOf(ctx: ExecutionContext): SessionClaims | null {
  const req = ctx.switchToHttp().getRequest();
  const auth = req.headers?.["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return verifySession(auth.slice(7).trim());
  }
  return null;
}

/**
 * Resolves the tenant for the request from the VERIFIED session token. No valid
 * token → the demo org (anonymous core loop keeps working). The old unverified
 * `x-org-id` header is no longer trusted — it could be spoofed to read any org.
 */
export const CurrentOrg = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return sessionOf(ctx)?.orgId ?? DEMO_ORG_ID;
});

/** The full verified session claims, or null when anonymous. */
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionClaims | null => sessionOf(ctx),
);
