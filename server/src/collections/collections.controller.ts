import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { CollectionsService } from "./collections.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly svc: CollectionsService) {}

  /** GET /v1/collections/summary — collected / remitted / commission / float. */
  @Get("summary")
  summary(@CurrentOrg() orgId: string) {
    return this.svc.summary(orgId);
  }

  /** GET /v1/collections/licenses — configured per-DISCOM collection licenses. */
  @Get("licenses")
  licenses(@CurrentOrg() orgId: string) {
    return this.svc.licenses(orgId);
  }

  /** GET /v1/collections/worklist — unpaid bills to chase (overdue first). */
  @Get("worklist")
  worklist(@CurrentOrg() orgId: string) {
    return this.svc.worklist(orgId);
  }

  /** POST /v1/collections — record a consumer payment (idempotent). */
  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreateCollectionDto) {
    return this.svc.create(orgId, dto);
  }

  /** POST /v1/collections/licenses/:id/remit — settle confirmed collections to the DISCOM. */
  @Post("licenses/:id/remit")
  remit(@CurrentOrg() orgId: string, @Param("id") licenseId: string) {
    return this.svc.remit(orgId, licenseId);
  }
}
