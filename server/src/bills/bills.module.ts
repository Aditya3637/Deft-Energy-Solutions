import { Module } from "@nestjs/common";

import { DiagnosisModule } from "../diagnosis/diagnosis.module";
import { BillingModule } from "../billing/billing.module";
import { BillsController } from "./bills.controller";
import { BillsService } from "./bills.service";

@Module({
  imports: [DiagnosisModule, BillingModule],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
