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
import { ComplianceModule } from "./compliance/compliance.module";
import { MarketsModule } from "./markets/markets.module";
import { EcosystemModule } from "./ecosystem/ecosystem.module";
import { EfficiencyModule } from "./efficiency/efficiency.module";
import { BillingModule } from "./billing/billing.module";
import { AuthModule } from "./auth/auth.module";
import { AccountModule } from "./account/account.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountModule,
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
    ComplianceModule,
    MarketsModule,
    EcosystemModule,
    EfficiencyModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
