import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  bess,
  carbonCredits,
  ghgScopes,
  microgrid,
  openAccess,
  vpp,
  type CarbonCredits,
  type MarketsInput,
} from "./markets.compute";
import { getIexQuote, iexMockQuote, type IexQuote } from "./iex/provider";
import { getHoldings, registryMockHoldings } from "./registry/provider";

@Injectable()
export class MarketsService {
  private readonly log = new Logger(MarketsService.name);

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

  /** Markets: open-access economics + carbon credits (registry holdings if live). */
  async markets(orgId: string) {
    const input = await this.load(orgId);
    return { openAccess: openAccess(input), carbonCredits: await this.creditsWithRegistry(orgId, input) };
  }

  /** Assets / DERs: BESS sizing, microgrid, VPP. */
  async assets(orgId: string) {
    const input = await this.load(orgId);
    return { bess: bess(input), microgrid: microgrid(input), vpp: vpp(input) };
  }

  /**
   * IEX day-ahead quote. Live when a feed is configured, else the indicative
   * reference. A live-fetch failure degrades to the reference (dashboard always
   * renders), with `source` telling the UI which it is.
   */
  async iex(): Promise<IexQuote> {
    try {
      return await getIexQuote();
    } catch (err) {
      this.log.warn(`IEX feed unavailable, using indicative reference: ${(err as Error).message}`);
      return iexMockQuote();
    }
  }

  /**
   * Carbon credits: the estimated *potential* (from avoided emissions) overlaid
   * with real registry holdings when a registry account is configured.
   */
  private async creditsWithRegistry(orgId: string, input: MarketsInput): Promise<CarbonCredits> {
    const estimated = carbonCredits(input);
    let holdings = registryMockHoldings();
    try {
      holdings = await getHoldings(orgId);
    } catch (err) {
      this.log.warn(`Credit registry unavailable, using estimate: ${(err as Error).message}`);
    }
    if (holdings.source !== "registry") return estimated;
    // Live registry: real held/retired/price, with the estimated project breakdown.
    return {
      source: "registry",
      asOf: holdings.asOf,
      held: holdings.held,
      retired: holdings.retired,
      ccPriceINR: holdings.ccPriceINR,
      projects: estimated.projects,
    };
  }
}
