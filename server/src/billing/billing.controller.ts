import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { BillingService } from "./billing.service";

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
}
