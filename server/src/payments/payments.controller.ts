import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  /** GET /v1/payments/summary — portfolio totals (due / overdue / on-time%). */
  @Get("summary")
  summary(@CurrentOrg() orgId: string) {
    return this.svc.summary(orgId);
  }

  /** GET /v1/payments — every tracked bill (with a due date) + derived status. */
  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.svc.list(orgId);
  }

  /** POST /v1/payments/:billId/pay — record a payment (defaults to now, full amount). */
  @Post(":billId/pay")
  pay(@CurrentOrg() orgId: string, @Param("billId") billId: string, @Body("paidAmount") paidAmount?: number) {
    return this.svc.markPaid(orgId, billId, typeof paidAmount === "number" ? paidAmount : undefined);
  }

  /** POST /v1/payments/:billId/unpay — undo a payment. */
  @Post(":billId/unpay")
  unpay(@CurrentOrg() orgId: string, @Param("billId") billId: string) {
    return this.svc.unpay(orgId, billId);
  }
}
