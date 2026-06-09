import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";

/** Default due date: +N days, formatted DD-MM-YYYY (UTC). */
function plusDays(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) => tx.task.findMany({ orderBy: { id: "asc" } }));
  }

  /** Create a task — e.g. from a diagnosis finding ("act on the savings"). */
  create(orgId: string, dto: CreateTaskDto) {
    const data: Prisma.TaskUncheckedCreateInput = {
      orgId,
      title: dto.title,
      building: dto.building ?? "Portfolio",
      source: (dto.source ?? "DIAGNOSIS") as Prisma.TaskUncheckedCreateInput["source"],
      priority: (dto.priority ?? "HIGH") as Prisma.TaskUncheckedCreateInput["priority"],
      assignee: dto.assignee ?? "Unassigned",
      due: dto.due ?? plusDays(14),
      savingsInr: dto.savingsInr ?? null,
      status: "TODO",
    };
    return this.prisma.withOrg(orgId, (tx) => tx.task.create({ data }));
  }
}
