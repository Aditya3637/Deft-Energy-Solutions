import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { COURSES, REDEEMABLE, VENDORS } from "./ecosystem.catalog";
import {
  badges,
  courses,
  reverseAuction,
  rewards,
  rfqs,
  type EcosystemInput,
} from "./ecosystem.compute";

@Injectable()
export class EcosystemService {
  constructor(private readonly prisma: PrismaService) {}

  private async load(orgId: string): Promise<EcosystemInput> {
    return this.prisma.withOrg(orgId, async (tx) => {
      const [bills, buildings, tasksDone, capex] = await Promise.all([
        tx.electricityBill.findMany({
          select: { powerFactor: true, paidAt: true, dueOn: true, energyKwh: true, totalAmountDue: true },
        }),
        tx.building.findMany({ select: { trendL: true, savingsInr: true } }),
        tx.task.count({ where: { status: "DONE" } }),
        tx.capexRequest.findMany({
          select: { id: true, project: true, building: true, amountInr: true, paybackYrs: true, stage: true, createdAt: true },
        }),
      ]);
      return { bills, buildings, tasksDone, capex };
    });
  }

  /** Leaderboard: badges + reward points (both derived from real activity). */
  async leaderboard(orgId: string) {
    const input = await this.load(orgId);
    return { badges: badges(input), rewards: rewards(input, REDEEMABLE) };
  }

  /** Marketplace: curated vendor directory + the org's RFQs + reverse auction. */
  async marketplace(orgId: string) {
    const input = await this.load(orgId);
    return { vendors: VENDORS, rfqs: rfqs(input.capex), reverseAuction: reverseAuction(input.capex) };
  }

  /** Training: the curated course library (progress 0 until a progress store exists). */
  async training(_orgId: string) {
    return { courses: courses(COURSES) };
  }
}
