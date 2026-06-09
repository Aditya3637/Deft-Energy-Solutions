import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { EcosystemService } from "./ecosystem.service";

@Controller()
export class EcosystemController {
  constructor(private readonly svc: EcosystemService) {}

  /** GET /v1/leaderboard — badges + reward points, derived from real activity. */
  @Get("leaderboard")
  leaderboard(@CurrentOrg() orgId: string) {
    return this.svc.leaderboard(orgId);
  }

  /** GET /v1/marketplace — vendor directory + the org's RFQs + reverse auction. */
  @Get("marketplace")
  marketplace(@CurrentOrg() orgId: string) {
    return this.svc.marketplace(orgId);
  }

  /** GET /v1/training — the curated course library. */
  @Get("training")
  training(@CurrentOrg() orgId: string) {
    return this.svc.training(orgId);
  }
}
