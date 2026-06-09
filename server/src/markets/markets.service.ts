import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  bess,
  carbonCredits,
  ghgScopes,
  microgrid,
  openAccess,
  vpp,
  type MarketsInput,
} from "./markets.compute";

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Read the org's real bills / buildings / equipment / GHG once, under RLS. */
  private async load(orgId: string): Promise<MarketsInput> {
    return this.prisma.withOrg(orgId, async (tx) => {
      const [bills, buildings, equipment, ghg] = await Promise.all([
        tx.electricityBill.findMany({
          select: {
            discom: true,
            energyKwh: true,
            maxDemandKva: true,
            contractDemandKva: true,
            sanctionedLoadKw: true,
            supplyVoltage: true,
            totalAmountDue: true,
            fixedDemandCharges: true,
            crossSubsidySurcharge: true,
            additionalSurcharge: true,
            wheelingCharges: true,
            todPeakRate: true,
            todOffPeakRate: true,
          },
        }),
        tx.building.findMany({
          select: { discom: true, sanctionedLoadKw: true, contractDemandKva: true, savingsInr: true },
        }),
        tx.equipment.findMany({ select: { type: true, ratingKw: true } }),
        tx.ghgInventory.findMany({ select: { year: true, scope1: true, scope2: true, scope3: true } }),
      ]);
      return { bills, buildings, equipment, ghg };
    });
  }

  /** Carbon: GHG inventory by scope (Scope 2 auto from bills). */
  async carbon(orgId: string) {
    return ghgScopes(await this.load(orgId));
  }

  /** Markets: open-access economics + carbon-credit potential. */
  async markets(orgId: string) {
    const input = await this.load(orgId);
    return { openAccess: openAccess(input), carbonCredits: carbonCredits(input) };
  }

  /** Assets / DERs: BESS sizing, microgrid, VPP. */
  async assets(orgId: string) {
    const input = await this.load(orgId);
    return { bess: bess(input), microgrid: microgrid(input), vpp: vpp(input) };
  }
}
