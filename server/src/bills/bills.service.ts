import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateBillDto } from "./dto/create-bill.dto";

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  create(orgId: string, dto: CreateBillDto) {
    const data: Prisma.ElectricityBillUncheckedCreateInput = { orgId, ...dto };
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.create({ data }),
    );
  }

  list(orgId: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    );
  }

  get(orgId: string, id: string) {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findUnique({ where: { id } }),
    );
  }
}
