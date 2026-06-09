import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CurrentOrg, CurrentSession } from "../common/current-org.decorator";
import type { SessionClaims } from "../auth/jwt";
import { BillingService } from "../billing/billing.service";
import { BillsService } from "./bills.service";
import { CreateBillDto } from "./dto/create-bill.dto";

@Controller("bills")
export class BillsController {
  constructor(
    private readonly bills: BillsService,
    private readonly billing: BillingService,
  ) {}

  @Post()
  async create(
    @CurrentOrg() orgId: string,
    @CurrentSession() session: SessionClaims | null,
    @Body() dto: CreateBillDto,
  ) {
    // Enforce the plan's saved-bill quota for signed-in orgs only — anonymous
    // (demo) requests are the free funnel and are never gated.
    if (session) await this.billing.assertCanSaveBill(orgId);
    return this.bills.create(orgId, dto);
  }

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.bills.list(orgId);
  }

  @Get(":id")
  get(@CurrentOrg() orgId: string, @Param("id") id: string) {
    return this.bills.get(orgId, id);
  }
}
