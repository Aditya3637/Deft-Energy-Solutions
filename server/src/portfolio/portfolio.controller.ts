import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { PortfolioService } from "./portfolio.service";

/** Portfolio aggregates for the dashboard (mirrors frontend api.portfolio.*). */
@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get("totals")
  totals(@CurrentOrg() orgId: string) {
    return this.portfolio.totals(orgId);
  }

  @Get("monthly")
  monthly(@CurrentOrg() orgId: string) {
    return this.portfolio.monthly(orgId);
  }

  @Get("forecast")
  forecast(@CurrentOrg() orgId: string) {
    return this.portfolio.forecast(orgId);
  }

  @Get("recent-bills")
  recentBills(@CurrentOrg() orgId: string) {
    return this.portfolio.recentBills(orgId);
  }
}
