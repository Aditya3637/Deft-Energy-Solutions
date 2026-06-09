import { Body, Controller, Get, Post } from "@nestjs/common";

import { CurrentSession } from "../common/current-org.decorator";
import { AuthService } from "./auth.service";
import type { SessionClaims } from "./jwt";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/request — { email } → sends (returns, in dev) a magic link. */
  @Post("request")
  request(@Body("email") email: string) {
    return this.auth.requestMagicLink(email);
  }

  /** POST /v1/auth/verify — { token } → { token: <session>, email, orgId }. */
  @Post("verify")
  verify(@Body("token") token: string) {
    return this.auth.verify(token);
  }

  /** GET /v1/auth/me — current session (or anonymous). */
  @Get("me")
  me(@CurrentSession() session: SessionClaims | null) {
    if (!session) return { authenticated: false };
    return this.auth.me(session.orgId, session.email).then((m) => ({ authenticated: true, ...m }));
  }
}
