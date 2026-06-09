import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.task.findMany({ orderBy: { id: "asc" } }),
    );
  }
}
