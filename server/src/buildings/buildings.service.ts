import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.building.findMany({ orderBy: { name: "asc" } }),
    );
  }

  get(orgId: string, id: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.building.findUnique({ where: { id } }),
    );
  }
}
