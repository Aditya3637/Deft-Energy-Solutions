import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { PLANS, planById, type Feature, type PlanId } from "./plans";

export type BillingStatus = {
  plan: PlanId;
  planName: string;
  status: string; // active | past_due | cancelled
  priceInr: number;
  unit: string;
  custom: boolean;
  periodEnd: string | null;
  usage: { buildings: number; savedBillsThisMonth: number };
  limits: { buildings: number; savedBillsPerMonth: number };
  features: Feature[];
};

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public plan catalog (no tenant context needed). */
  plans() {
    return PLANS;
  }

  /** The org's current plan, live usage and entitlements. */
  async status(orgId: string): Promise<BillingStatus> {
    const startOfMonth = (() => {
      const n = new Date();
      return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
    })();

    const { sub, buildings, savedBillsThisMonth } = await this.prisma.withOrg(orgId, async (tx) => {
      const [sub, buildings, savedBillsThisMonth] = await Promise.all([
        tx.subscription.findFirst({ where: { status: "active" }, orderBy: { startDate: "desc" } }),
        tx.building.count(),
        tx.electricityBill.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);
      return { sub, buildings, savedBillsThisMonth };
    });

    const plan = planById(sub?.plan ?? "FREE");
    return {
      plan: plan.id,
      planName: plan.name,
      status: sub?.status ?? "active",
      priceInr: plan.priceInr,
      unit: plan.unit,
      custom: plan.custom,
      periodEnd: sub?.endDate ? sub.endDate.toISOString() : null,
      usage: { buildings, savedBillsThisMonth },
      limits: plan.limits,
      features: plan.features,
    };
  }
}
