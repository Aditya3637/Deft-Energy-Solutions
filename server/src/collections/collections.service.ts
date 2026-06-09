import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { commissionPaise, paiseToRupees, rupeesToPaise, type CommissionModel } from "./money";
import { selectConnector } from "./connector";

/** Money is BigInt paise in the DB; the API exposes rupee numbers for display. */
const inr = (paise: bigint | number): number => paiseToRupees(Number(paise));

type LicenseRow = {
  id: string; discom: string; mode: string; aggregator: string; status: string;
  commissionType: string; commissionPerTxnPaise: bigint; commissionRateBps: number;
  commissionCurrentBps: number; commissionOutstandingBps: number;
  commissionCapPaise: bigint; commissionMinPaise: bigint; settlementCycle: string; floatPaise: bigint;
};

function modelOf(l: LicenseRow): CommissionModel {
  return {
    type: l.commissionType as CommissionModel["type"],
    perTxnPaise: Number(l.commissionPerTxnPaise),
    rateBps: l.commissionRateBps,
    currentBps: l.commissionCurrentBps,
    outstandingBps: l.commissionOutstandingBps,
    capPaise: Number(l.commissionCapPaise),
    minPaise: Number(l.commissionMinPaise),
  };
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async licenses(orgId: string) {
    const rows = await this.prisma.withOrg(orgId, (tx) => tx.discomLicense.findMany({ orderBy: { discom: "asc" } }));
    return rows.map((l) => ({
      id: l.id,
      discom: l.discom,
      mode: l.mode,
      aggregator: l.aggregator,
      status: l.status,
      commissionType: l.commissionType,
      settlementCycle: l.settlementCycle,
      floatInr: inr(l.floatPaise),
    }));
  }

  /** Record a consumer payment (idempotent), compute commission, settle the bill. */
  async create(orgId: string, dto: CreateCollectionDto) {
    return this.prisma.withOrg(orgId, async (tx) => {
      const existing = await tx.collection.findUnique({
        where: { orgId_idempotencyKey: { orgId, idempotencyKey: dto.idempotencyKey } },
      });
      if (existing) return this.mapCollection(existing); // no double-collect

      const license = (await tx.discomLicense.findUnique({ where: { id: dto.licenseId } })) as LicenseRow | null;
      if (!license) throw new NotFoundException(`License ${dto.licenseId} not found`);

      const amountP = rupeesToPaise(dto.amountInr);
      const commP = commissionPaise(modelOf(license), amountP, dto.isOutstanding ?? false);

      const created = await tx.collection.create({
        data: {
          orgId,
          licenseId: dto.licenseId,
          billId: dto.billId ?? null,
          consumerNumber: dto.consumerNumber ?? "",
          amountPaise: BigInt(amountP),
          isOutstanding: dto.isOutstanding ?? false,
          method: dto.method as never,
          status: "CONFIRMED",
          idempotencyKey: dto.idempotencyKey,
          commissionPaise: BigInt(commP),
          collectedAt: new Date(),
        },
      });

      // Settle the underlying obligation on the payments layer.
      if (dto.billId) {
        const bill = await tx.electricityBill.findUnique({ where: { id: dto.billId }, select: { id: true } });
        if (bill) {
          await tx.electricityBill.update({
            where: { id: dto.billId },
            data: { paidAt: new Date(), paidAmount: dto.amountInr },
          });
        }
      }
      return this.mapCollection(created);
    });
  }

  /**
   * Settle all CONFIRMED-but-unremitted collections for a license into one
   * remittance batch (gross to the DISCOM; commission is our earning/float).
   * NOTE: the connector call sits inside the txn (fine for the mock). A real
   * rail should settle out-of-band and update with a two-phase status.
   */
  async remit(orgId: string, licenseId: string) {
    return this.prisma.withOrg(orgId, async (tx) => {
      const license = (await tx.discomLicense.findUnique({ where: { id: licenseId } })) as LicenseRow | null;
      if (!license) throw new NotFoundException(`License ${licenseId} not found`);

      const pending = await tx.collection.findMany({
        where: { licenseId, status: "CONFIRMED", remittanceId: null },
        select: { id: true, amountPaise: true, commissionPaise: true },
      });
      if (pending.length === 0) throw new BadRequestException("No confirmed collections to remit");

      const gross = pending.reduce((s, c) => s + Number(c.amountPaise), 0);
      const commission = pending.reduce((s, c) => s + Number(c.commissionPaise), 0);
      const periodDate = new Date();

      const res = await selectConnector(license.mode as never, license.aggregator).remit({
        discom: license.discom,
        periodDate: periodDate.toISOString(),
        grossPaise: gross,
        commissionPaise: commission,
        count: pending.length,
      });

      const remittance = await tx.remittance.create({
        data: {
          orgId, licenseId, periodDate,
          grossPaise: BigInt(gross),
          remittedPaise: BigInt(res.remittedPaise),
          commissionPaise: BigInt(commission),
          count: pending.length,
          status: res.settled ? "SETTLED" : "PENDING",
        },
      });
      await tx.collection.updateMany({
        where: { id: { in: pending.map((p) => p.id) } },
        data: { status: "REMITTED", remittanceId: remittance.id },
      });
      // Our commission accrues to the working balance.
      await tx.discomLicense.update({
        where: { id: licenseId },
        data: { floatPaise: { increment: BigInt(commission) } },
      });

      return {
        id: remittance.id,
        discom: license.discom,
        count: remittance.count,
        grossInr: inr(remittance.grossPaise),
        remittedInr: inr(remittance.remittedPaise),
        commissionInr: inr(remittance.commissionPaise),
        status: remittance.status,
        providerRef: res.providerRef,
      };
    });
  }

  async summary(orgId: string) {
    return this.prisma.withOrg(orgId, async (tx) => {
      const [licenses, collections, remittances] = await Promise.all([
        tx.discomLicense.findMany(),
        tx.collection.findMany({ select: { licenseId: true, amountPaise: true, commissionPaise: true, status: true, remittanceId: true } }),
        tx.remittance.findMany({ select: { remittedPaise: true } }),
      ]);

      const isCollected = (s: string) => s === "CONFIRMED" || s === "REMITTED" || s === "RECONCILED";
      let collectedP = 0, commissionP = 0, pendingRemitP = 0;
      const byLicense = new Map<string, { collected: number; commission: number }>();
      for (const c of collections) {
        if (!isCollected(c.status)) continue;
        const amt = Number(c.amountPaise);
        const comm = Number(c.commissionPaise);
        collectedP += amt;
        commissionP += comm;
        if (c.status === "CONFIRMED" && c.remittanceId == null) pendingRemitP += amt;
        const b = byLicense.get(c.licenseId) ?? { collected: 0, commission: 0 };
        b.collected += amt;
        b.commission += comm;
        byLicense.set(c.licenseId, b);
      }
      const remittedP = remittances.reduce((s, r) => s + Number(r.remittedPaise), 0);
      const floatP = licenses.reduce((s, l) => s + Number(l.floatPaise), 0);

      return {
        licenses: licenses.length,
        activeLicenses: licenses.filter((l) => l.status === "ACTIVE").length,
        collectedInr: paiseToRupees(collectedP),
        commissionInr: paiseToRupees(commissionP),
        pendingRemitInr: paiseToRupees(pendingRemitP),
        remittedInr: paiseToRupees(remittedP),
        floatInr: paiseToRupees(floatP),
        byDiscom: licenses
          .map((l) => {
            const b = byLicense.get(l.id) ?? { collected: 0, commission: 0 };
            return {
              discom: l.discom,
              mode: l.mode,
              status: l.status,
              collectedInr: paiseToRupees(b.collected),
              commissionInr: paiseToRupees(b.commission),
            };
          })
          .sort((a, b) => b.collectedInr - a.collectedInr),
      };
    });
  }

  /** Unpaid bills (overdue first) to chase — matched to a DISCOM license. */
  async worklist(orgId: string) {
    return this.prisma.withOrg(orgId, async (tx) => {
      const [bills, licenses] = await Promise.all([
        tx.electricityBill.findMany({
          where: { dueOn: { not: null }, paidAt: null },
          orderBy: { dueOn: "asc" },
          take: 200,
          select: {
            id: true, discom: true, consumerName: true, consumerNumber: true,
            totalAmountDue: true, dueOn: true, buildingId: true,
            building: { select: { name: true } },
          },
        }),
        tx.discomLicense.findMany({ select: { id: true, discom: true } }),
      ]);
      const now = Date.now();
      const licByDiscom = new Map(licenses.map((l) => [l.discom.toLowerCase(), l.id]));
      const matchLicense = (discom: string | null): string | null => {
        if (!discom) return null;
        const d = discom.toLowerCase();
        for (const [name, id] of licByDiscom) if (d.includes(name) || name.includes(d)) return id;
        return null;
      };
      return bills.map((b) => {
        const due = b.dueOn ? b.dueOn.getTime() : null;
        const daysOverdue = due && due < now ? Math.floor((now - due) / 86_400_000) : 0;
        return {
          billId: b.id,
          asset: b.building?.name ?? b.consumerName ?? "—",
          buildingId: b.buildingId,
          discom: b.discom ?? "",
          consumerNumber: b.consumerNumber ?? "",
          amountInr: Math.round(b.totalAmountDue ?? 0),
          dueOn: b.dueOn ? b.dueOn.toISOString() : null,
          daysOverdue,
          licenseId: matchLicense(b.discom),
        };
      });
    });
  }

  private mapCollection(c: {
    id: string; licenseId: string; billId: string | null; consumerNumber: string;
    amountPaise: bigint; isOutstanding: boolean; method: string; status: string;
    commissionPaise: bigint; collectedAt: Date;
  }) {
    return {
      id: c.id,
      licenseId: c.licenseId,
      billId: c.billId,
      consumerNumber: c.consumerNumber,
      amountInr: inr(c.amountPaise),
      isOutstanding: c.isOutstanding,
      method: c.method,
      status: c.status,
      commissionInr: inr(c.commissionPaise),
      collectedAt: c.collectedAt.toISOString(),
    };
  }
}
