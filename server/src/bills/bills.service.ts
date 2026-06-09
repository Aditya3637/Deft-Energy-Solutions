import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { DiagnosisService } from "../diagnosis/diagnosis.service";
import { CreateBillDto } from "./dto/create-bill.dto";

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly diagnosis: DiagnosisService,
  ) {}

  /** Persist a bill, then run + store its diagnosis, and return both. */
  async create(orgId: string, dto: CreateBillDto) {
    const data: Prisma.ElectricityBillUncheckedCreateInput = { orgId, ...dto };
    const bill = await this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.create({ data }),
    );
    await this.diagnosis.runForBill(orgId, bill.id);
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findUnique({
        where: { id: bill.id },
        include: { diagnosis: { include: { findings: true } } },
      }),
    );
  }

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { diagnosis: true },
      }),
    );
  }

  get(orgId: string, id: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findUnique({
        where: { id },
        include: { diagnosis: { include: { findings: true } } },
      }),
    );
  }
}
