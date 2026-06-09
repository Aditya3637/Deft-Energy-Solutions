import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CurrentOrg } from "../common/current-org.decorator";
import { BillsService } from "./bills.service";
import { CreateBillDto } from "./dto/create-bill.dto";

@Controller("bills")
export class BillsController {
  constructor(private readonly bills: BillsService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreateBillDto) {
    return this.bills.create(orgId, dto);
  }

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.bills.list(orgId);
  }

  @Get(":id")
  get(@CurrentOrg() orgId: string, @Param("id") id: string) {
    return this.bills.get(orgId, id);
  }
}
