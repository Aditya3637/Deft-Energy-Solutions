import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.alertInstance.findMany({ orderBy: { triggered: "desc" } }),
    );
  }

  rules(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.alertRule.findMany({ orderBy: { id: "asc" } }),
    );
  }
}
