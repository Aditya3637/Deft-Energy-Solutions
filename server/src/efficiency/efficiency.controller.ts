import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { EfficiencyService } from "./efficiency.service";

@Controller("efficiency")
export class EfficiencyController {
  constructor(private readonly svc: EfficiencyService) {}

  /** GET /v1/efficiency — ranked ECM potential, derived from the org's consumption. */
  @Get()
  potential(@CurrentOrg() orgId: string) {
    return this.svc.potential(orgId);
  }
}
