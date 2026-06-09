import { Body, Controller, Get, Headers, HttpCode, Post, Req, UnauthorizedException } from "@nestjs/common";

import { CurrentOrg, CurrentSession } from "../common/current-org.decorator";
import type { SessionClaims } from "../auth/jwt";
import { BillingService } from "./billing.service";

type RawReq = { rawBody?: Buffer; body?: unknown };

@Controller("billing")
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  /** GET /v1/billing/plans — the public plan catalog (pricing page). */
  @Get("plans")
  plans() {
    return this.svc.plans();
  }

  /** GET /v1/billing — the org's current plan, usage and entitlements. */
  @Get()
  status(@CurrentOrg() orgId: string) {
    return this.svc.status(orgId);
  }

  /** POST /v1/billing/trial — start a no-card 14-day Pro trial (one per workspace). */
  @Post("trial")
  startTrial(@CurrentOrg() orgId: string, @CurrentSession() session: SessionClaims | null) {
    if (!session) throw new UnauthorizedException("Sign in to start a trial.");
    return this.svc.startTrial(orgId);
  }

  /** POST /v1/billing/checkout — begin an upgrade (subscription, link, or invoice). */
  @Post("checkout")
  checkout(@CurrentOrg() orgId: string, @CurrentSession() session: SessionClaims | null, @Body("plan") plan: string) {
    if (!session) throw new UnauthorizedException("Sign in to upgrade.");
    return this.svc.checkout(orgId, plan);
  }

  /** POST /v1/billing/activate — self-activation (MANUAL provider only). */
  @Post("activate")
  activate(@CurrentOrg() orgId: string, @CurrentSession() session: SessionClaims | null, @Body("plan") plan: string) {
    if (!session) throw new UnauthorizedException("Sign in to activate.");
    return this.svc.activateManual(orgId, plan);
  }

  /** POST /v1/billing/webhook — payment gateway callback (signature-verified). */
  @Post("webhook")
  @HttpCode(200)
  webhook(@Req() req: RawReq, @Headers("x-razorpay-signature") signature: string) {
    const raw = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body ?? {});
    return this.svc.webhook(raw, signature ?? "");
  }
}
