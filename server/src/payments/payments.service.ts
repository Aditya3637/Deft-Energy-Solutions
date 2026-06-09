import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export type PaymentStatus =
  | "PAID_ON_TIME"
  | "PAID_LATE"
  | "OVERDUE"
  | "DUE_SOON"
  | "UPCOMING";

export type PaymentRow = {
  id: string;
  building: string;
  buildingId: string | null;
  discom: string;
  month: string;
  amountInr: number;
  dueOn: string | null; // ISO
  paidAt: string | null; // ISO
  paidAmount: number | null;
  status: PaymentStatus;
  daysOverdue: number;
};

export type Bucket = { count: number; amountInr: number };
export type PaymentSummary = {
  total: number;
  unpaid: number;
  paid: number;
  outstandingInr: number;
  overdue: Bucket;
  dueSoon: Bucket;
  upcoming: Bucket;
  paidOnTime: number;
  paidLate: number;
  onTimePct: number | null;
};

const DAY = 86_400_000;
const DUE_SOON_DAYS = 7;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UTC day number, so "paid on the due date" is on-time regardless of time of day. */
function dayNum(d: Date): number {
  return Math.floor(d.getTime() / DAY);
}

function deriveStatus(dueOn: Date | null, paidAt: Date | null, now: Date): PaymentStatus {
  if (paidAt) {
    if (dueOn && dayNum(paidAt) > dayNum(dueOn)) return "PAID_LATE";
    return "PAID_ON_TIME";
  }
  if (!dueOn) return "UPCOMING";
  const days = dayNum(dueOn) - dayNum(now);
  if (days < 0) return "OVERDUE";
  if (days <= DUE_SOON_DAYS) return "DUE_SOON";
  return "UPCOMING";
}

type Row = {
  id: string;
  buildingId: string | null;
  discom: string | null;
  consumerName: string | null;
  totalAmountDue: number | null;
  dueOn: Date | null;
  paidAt: Date | null;
  paidAmount: number | null;
  billDate: string | null;
  building: { name: string } | null;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Bills that represent a payment obligation (have a parsed due date). */
  private rows(orgId: string): Promise<Row[]> {
    return this.prisma.withOrg(orgId, (tx) =>
      tx.electricityBill.findMany({
        where: { dueOn: { not: null } },
        orderBy: { dueOn: "asc" },
        select: {
          id: true,
          buildingId: true,
          discom: true,
          consumerName: true,
          totalAmountDue: true,
          dueOn: true,
          paidAt: true,
          paidAmount: true,
          billDate: true,
          building: { select: { name: true } },
        },
      }),
    ) as unknown as Promise<Row[]>;
  }

  private toRow(r: Row, now: Date): PaymentRow {
    const status = deriveStatus(r.dueOn, r.paidAt, now);
    const daysOverdue =
      status === "OVERDUE" && r.dueOn ? dayNum(now) - dayNum(r.dueOn) : 0;
    const monthSrc = r.dueOn ?? null;
    const month = monthSrc
      ? `${MONTHS[monthSrc.getUTCMonth()]} ${monthSrc.getUTCFullYear()}`
      : "";
    return {
      id: r.id,
      building: r.building?.name ?? r.consumerName ?? "—",
      buildingId: r.buildingId,
      discom: r.discom ?? "",
      month,
      amountInr: Math.round(r.totalAmountDue ?? 0),
      dueOn: r.dueOn ? r.dueOn.toISOString() : null,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      paidAmount: r.paidAmount ?? null,
      status,
      daysOverdue,
    };
  }

  async list(orgId: string): Promise<PaymentRow[]> {
    const now = new Date();
    const rows = (await this.rows(orgId)).map((r) => this.toRow(r, now));
    // Action-first ordering: overdue, due-soon, upcoming, then paid.
    const rank: Record<PaymentStatus, number> = {
      OVERDUE: 0, DUE_SOON: 1, UPCOMING: 2, PAID_LATE: 3, PAID_ON_TIME: 4,
    };
    return rows.sort(
      (a, b) => rank[a.status] - rank[b.status] || (a.dueOn ?? "").localeCompare(b.dueOn ?? ""),
    );
  }

  async summary(orgId: string): Promise<PaymentSummary> {
    const now = new Date();
    const rows = (await this.rows(orgId)).map((r) => this.toRow(r, now));
    const s: PaymentSummary = {
      total: rows.length,
      unpaid: 0,
      paid: 0,
      outstandingInr: 0,
      overdue: { count: 0, amountInr: 0 },
      dueSoon: { count: 0, amountInr: 0 },
      upcoming: { count: 0, amountInr: 0 },
      paidOnTime: 0,
      paidLate: 0,
      onTimePct: null,
    };
    for (const r of rows) {
      const paid = r.status === "PAID_ON_TIME" || r.status === "PAID_LATE";
      if (paid) {
        s.paid += 1;
        if (r.status === "PAID_ON_TIME") s.paidOnTime += 1;
        else s.paidLate += 1;
      } else {
        s.unpaid += 1;
        s.outstandingInr += r.amountInr;
        if (r.status === "OVERDUE") {
          s.overdue.count += 1;
          s.overdue.amountInr += r.amountInr;
        } else if (r.status === "DUE_SOON") {
          s.dueSoon.count += 1;
          s.dueSoon.amountInr += r.amountInr;
        } else {
          s.upcoming.count += 1;
          s.upcoming.amountInr += r.amountInr;
        }
      }
    }
    const settled = s.paidOnTime + s.paidLate;
    s.onTimePct = settled > 0 ? Math.round((s.paidOnTime / settled) * 1000) / 10 : null;
    return s;
  }

  /** Mark a bill paid (defaults: paid now, full amount due). */
  async markPaid(orgId: string, billId: string, paidAmount?: number): Promise<PaymentRow> {
    const updated = await this.prisma.withOrg(orgId, async (tx) => {
      const bill = await tx.electricityBill.findUnique({ where: { id: billId }, select: { totalAmountDue: true } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
      return tx.electricityBill.update({
        where: { id: billId },
        data: { paidAt: new Date(), paidAmount: paidAmount ?? bill.totalAmountDue ?? 0 },
        select: {
          id: true, buildingId: true, discom: true, consumerName: true, totalAmountDue: true,
          dueOn: true, paidAt: true, paidAmount: true, billDate: true, building: { select: { name: true } },
        },
      });
    });
    return this.toRow(updated as unknown as Row, new Date());
  }

  /** Undo a payment (set back to unpaid). */
  async unpay(orgId: string, billId: string): Promise<PaymentRow> {
    const updated = await this.prisma.withOrg(orgId, async (tx) => {
      const bill = await tx.electricityBill.findUnique({ where: { id: billId }, select: { id: true } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
      return tx.electricityBill.update({
        where: { id: billId },
        data: { paidAt: null, paidAmount: null },
        select: {
          id: true, buildingId: true, discom: true, consumerName: true, totalAmountDue: true,
          dueOn: true, paidAt: true, paidAmount: true, billDate: true, building: { select: { name: true } },
        },
      });
    });
    return this.toRow(updated as unknown as Row, new Date());
  }
}
