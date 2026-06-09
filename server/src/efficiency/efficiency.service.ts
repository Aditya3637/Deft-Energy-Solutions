import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { computeEfficiency, type EfficiencyResult } from "./efficiency.compute";

@Injectable()
export class EfficiencyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Estimated consumption-reduction (ECM) potential, derived from real bills. */
  async potential(orgId: string): Promise<EfficiencyResult> {
    const { bills, buildings } = await this.prisma.withOrg(orgId, async (tx) => {
      const [bills, buildings] = await Promise.all([
        tx.electricityBill.findMany({ select: { energyKwh: true, totalAmountDue: true, buildingId: true } }),
        tx.building.findMany({ select: { id: true, type: true } }),
      ]);
      return { bills, buildings };
    });
    return computeEfficiency({ bills, buildings });
  }
}
