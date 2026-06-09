import { Controller, Get, Param } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { BuildingsService } from "./buildings.service";

/** Mirrors the frontend `api.portfolio.buildings()` / `.building(id)` contract. */
@Controller("buildings")
export class BuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.buildings.list(orgId);
  }

  @Get(":id")
  get(@CurrentOrg() orgId: string, @Param("id") id: string) {
    return this.buildings.get(orgId, id);
  }
}
