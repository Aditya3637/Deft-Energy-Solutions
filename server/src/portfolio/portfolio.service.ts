import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { forecast, monthlyL, recentBills, totals } from "./portfolio.util";

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  private buildings(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.building.findMany({ orderBy: { name: "asc" } }),
    );
  }

  async totals(orgId: string) {
    return totals(await this.buildings(orgId));
  }
  async monthly(orgId: string) {
    return monthlyL(await this.buildings(orgId));
  }
  async forecast(orgId: string) {
    return forecast(await this.buildings(orgId));
  }
  async recentBills(orgId: string) {
    return recentBills(await this.buildings(orgId));
  }
}
