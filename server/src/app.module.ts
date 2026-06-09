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
  ],
  controllers: [HealthController],
})
export class AppModule {}
