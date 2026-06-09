import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { MarketsService } from "./markets.service";

@Controller()
export class MarketsController {
  constructor(private readonly svc: MarketsService) {}

  /** GET /v1/carbon — GHG inventory by scope (Scope 2 derived from bills). */
  @Get("carbon")
  carbon(@CurrentOrg() orgId: string) {
    return this.svc.carbon(orgId);
  }

  /** GET /v1/markets — open-access economics + carbon-credit potential. */
  @Get("markets")
  markets(@CurrentOrg() orgId: string) {
    return this.svc.markets(orgId);
  }

  /** GET /v1/assets — BESS / microgrid / VPP, sized from the org's load. */
  @Get("assets")
  assets(@CurrentOrg() orgId: string) {
    return this.svc.assets(orgId);
  }
}
