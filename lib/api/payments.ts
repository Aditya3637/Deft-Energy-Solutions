import { apiFetch, isApiConfigured, liveServer, NO_STORE } from "@/lib/api/client";

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
  dueOn: string | null;
  paidAt: string | null;
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

/** Static-demo rows (Pages build / fallback). Status is explicit so it never drifts. */
const FIXTURE_ROWS: PaymentRow[] = [
  { id: "f1", building: "CoolChain Cold Storage", buildingId: "coolchain-cold", discom: "TANGEDCO", month: "May 2026", amountInr: 1284000, dueOn: "2026-05-20T00:00:00.000Z", paidAt: null, paidAmount: null, status: "OVERDUE", daysOverdue: 20 },
  { id: "f2", building: "Riverside Mall", buildingId: "riverside-mall", discom: "BESCOM", month: "May 2026", amountInr: 3650000, dueOn: "2026-05-28T00:00:00.000Z", paidAt: null, paidAmount: null, status: "OVERDUE", daysOverdue: 12 },
  { id: "f3", building: "TechPark Block C", buildingId: "techpark-c", discom: "TSSPDCL", month: "May 2026", amountInr: 1720000, dueOn: "2026-06-12T00:00:00.000Z", paidAt: null, paidAmount: null, status: "DUE_SOON", daysOverdue: 0 },
  { id: "f4", building: "Acme Bhosari Plant", buildingId: "acme-bhosari", discom: "MSEDCL", month: "May 2026", amountInr: 1500000, dueOn: "2026-06-13T00:00:00.000Z", paidAt: null, paidAmount: null, status: "DUE_SOON", daysOverdue: 0 },
  { id: "f5", building: "Orchid Tower (HQ)", buildingId: "orchid-tower", discom: "Adani Electricity", month: "Jun 2026", amountInr: 2475000, dueOn: "2026-06-27T00:00:00.000Z", paidAt: null, paidAmount: null, status: "UPCOMING", daysOverdue: 0 },
  { id: "f6", building: "Acme Chakan Unit 2", buildingId: "acme-chakan", discom: "MSEDCL", month: "Jun 2026", amountInr: 1125000, dueOn: "2026-06-28T00:00:00.000Z", paidAt: null, paidAmount: null, status: "UPCOMING", daysOverdue: 0 },
  { id: "f7", building: "Acme Bhosari Plant", buildingId: "acme-bhosari", discom: "MSEDCL", month: "Apr 2026", amountInr: 1460000, dueOn: "2026-04-27T00:00:00.000Z", paidAt: "2026-04-24T00:00:00.000Z", paidAmount: 1460000, status: "PAID_ON_TIME", daysOverdue: 0 },
  { id: "f8", building: "Riverside Mall", buildingId: "riverside-mall", discom: "BESCOM", month: "Apr 2026", amountInr: 3520000, dueOn: "2026-04-28T00:00:00.000Z", paidAt: "2026-04-26T00:00:00.000Z", paidAmount: 3520000, status: "PAID_ON_TIME", daysOverdue: 0 },
  { id: "f9", building: "Orchid Tower (HQ)", buildingId: "orchid-tower", discom: "Adani Electricity", month: "Apr 2026", amountInr: 2390000, dueOn: "2026-04-27T00:00:00.000Z", paidAt: "2026-04-22T00:00:00.000Z", paidAmount: 2390000, status: "PAID_ON_TIME", daysOverdue: 0 },
  { id: "f10", building: "TechPark Block C", buildingId: "techpark-c", discom: "TSSPDCL", month: "Mar 2026", amountInr: 1680000, dueOn: "2026-03-28T00:00:00.000Z", paidAt: "2026-04-03T00:00:00.000Z", paidAmount: 1680000, status: "PAID_LATE", daysOverdue: 0 },
];

function summarize(rows: PaymentRow[]): PaymentSummary {
  const s: PaymentSummary = {
    total: rows.length, unpaid: 0, paid: 0, outstandingInr: 0,
    overdue: { count: 0, amountInr: 0 }, dueSoon: { count: 0, amountInr: 0 },
    upcoming: { count: 0, amountInr: 0 }, paidOnTime: 0, paidLate: 0, onTimePct: null,
  };
  for (const r of rows) {
    if (r.status === "PAID_ON_TIME" || r.status === "PAID_LATE") {
      s.paid += 1;
      if (r.status === "PAID_ON_TIME") s.paidOnTime += 1;
      else s.paidLate += 1;
    } else {
      s.unpaid += 1;
      s.outstandingInr += r.amountInr;
      const b = r.status === "OVERDUE" ? s.overdue : r.status === "DUE_SOON" ? s.dueSoon : s.upcoming;
      b.count += 1;
      b.amountInr += r.amountInr;
    }
  }
  const settled = s.paidOnTime + s.paidLate;
  s.onTimePct = settled > 0 ? Math.round((s.paidOnTime / settled) * 1000) / 10 : null;
  return s;
}

export const payments = {
  async summary(): Promise<PaymentSummary> {
    if (liveServer()) {
      try {
        return await apiFetch<PaymentSummary>("/v1/payments/summary", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return summarize(FIXTURE_ROWS);
  },

  async list(): Promise<PaymentRow[]> {
    if (liveServer()) {
      try {
        return await apiFetch<PaymentRow[]>("/v1/payments", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return FIXTURE_ROWS.map((r) => ({ ...r }));
  },

  /** Record a payment. Persists on a live backend; returns null on the static demo. */
  async markPaid(billId: string, paidAmount?: number): Promise<PaymentRow | null> {
    if (!isApiConfigured()) return null;
    try {
      return await apiFetch<PaymentRow>(`/v1/payments/${billId}/pay`, {
        method: "POST",
        body: JSON.stringify(paidAmount != null ? { paidAmount } : {}),
      });
    } catch {
      return null;
    }
  },

  async unpay(billId: string): Promise<PaymentRow | null> {
    if (!isApiConfigured()) return null;
    try {
      return await apiFetch<PaymentRow>(`/v1/payments/${billId}/unpay`, { method: "POST" });
    } catch {
      return null;
    }
  },
};
