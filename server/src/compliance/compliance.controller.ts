import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { ComplianceService } from "./compliance.service";

@Controller("compliance")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  /** GET /v1/compliance — scorecard, BRSR sections and ESG, derived from the org's data. */
  @Get()
  scorecard(@CurrentOrg() orgId: string) {
    return this.compliance.scorecard(orgId);
  }
}
