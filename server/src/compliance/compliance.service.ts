import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { computeCompliance, type ComplianceScorecard } from "./compliance.compute";

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Live compliance scorecard derived from the org's bills, buildings and GHG inventory. */
  async scorecard(orgId: string): Promise<ComplianceScorecard> {
    const { bills, buildings, ghg } = await this.prisma.withOrg(orgId, async (tx) => {
      const [bills, buildings, ghg] = await Promise.all([
        tx.electricityBill.findMany({
          select: {
            powerFactor: true,
            pfPenaltyAmt: true,
            dueOn: true,
            paidAt: true,
            energyKwh: true,
            maxDemandKva: true,
            contractDemandKva: true,
          },
        }),
        tx.building.findMany({ select: { billsReceived: true, billsExpected: true } }),
        tx.ghgInventory.findMany({ select: { year: true } }),
      ]);
      return { bills, buildings, ghg };
    });

    return computeCompliance({
      now: new Date(),
      bills,
      buildings,
      ghgYears: ghg.map((g) => g.year),
    });
  }
}
