import { Controller, Get } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { AlertsService } from "./alerts.service";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.alerts.list(orgId);
  }

  @Get("rules")
  rules(@CurrentOrg() orgId: string) {
    return this.alerts.rules(orgId);
  }
}
