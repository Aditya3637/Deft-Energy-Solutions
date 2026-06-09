import { Body, Controller, Get, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { CorrectionsService } from "./corrections.service";
import { SubmitCorrectionsDto } from "./dto/submit-corrections.dto";

@Controller("corrections")
export class CorrectionsController {
  constructor(private readonly svc: CorrectionsService) {}

  /** POST /v1/corrections — log a reviewed extraction (per-field model vs final). */
  @Post()
  submit(@CurrentOrg() orgId: string, @Body() dto: SubmitCorrectionsDto) {
    return this.svc.record(orgId, dto);
  }

  /** GET /v1/corrections/accuracy — per-DISCOM / per-field accuracy rollup. */
  @Get("accuracy")
  accuracy(@CurrentOrg() orgId: string) {
    return this.svc.accuracy(orgId);
  }
}
