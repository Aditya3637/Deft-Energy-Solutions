import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { BuildingsModule } from "./buildings/buildings.module";
import { BillsModule } from "./bills/bills.module";
import { DiagnosisModule } from "./diagnosis/diagnosis.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { TasksModule } from "./tasks/tasks.module";
import { AlertsModule } from "./alerts/alerts.module";
import { ExtractModule } from "./extract/extract.module";
import { BillFetchModule } from "./billfetch/billfetch.module";
import { CorrectionsModule } from "./corrections/corrections.module";
import { PaymentsModule } from "./payments/payments.module";
import { CollectionsModule } from "./collections/collections.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BuildingsModule,
    BillsModule,
    DiagnosisModule,
    PortfolioModule,
    TasksModule,
    AlertsModule,
    ExtractModule,
    BillFetchModule,
    CorrectionsModule,
    PaymentsModule,
    CollectionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
