import { Body, Controller, Delete, Get, Patch, UnauthorizedException } from "@nestjs/common";

import { CurrentSession } from "../common/current-org.decorator";
import type { SessionClaims } from "../auth/jwt";
import { AccountService } from "./account.service";

/**
 * DPDP self-service. Every route requires a real verified session (not the
 * anonymous demo org) — a data principal acting on their own data.
 */
@Controller("account")
export class AccountController {
  constructor(private readonly svc: AccountService) {}

  private require(session: SessionClaims | null): SessionClaims {
    if (!session) throw new UnauthorizedException("Sign in to manage your data");
    return session;
  }

  /** GET /v1/account — profile + consent state. */
  @Get()
  profile(@CurrentSession() session: SessionClaims | null) {
    const s = this.require(session);
    return this.svc.profile(s.orgId, s.email);
  }

  /** GET /v1/account/export — full machine-readable data export (Right to access). */
  @Get("export")
  exportData(@CurrentSession() session: SessionClaims | null) {
    const s = this.require(session);
    return this.svc.exportData(s.orgId, s.email);
  }

  /** PATCH /v1/account — correct profile (Right to correction). */
  @Patch()
  correct(@CurrentSession() session: SessionClaims | null, @Body("name") name: string) {
    const s = this.require(session);
    return this.svc.correctName(s.orgId, s.email, (name ?? "").trim() || "User");
  }

  /** DELETE /v1/account — erase account + org + all data (Right to erasure). */
  @Delete()
  erase(@CurrentSession() session: SessionClaims | null) {
    const s = this.require(session);
    return this.svc.erase(s.orgId, s.email);
  }
}
