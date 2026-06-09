import { apiFetch, isApiConfigured, liveServer, NO_STORE } from "@/lib/api/client";

export type LicenseRow = {
  id: string;
  discom: string;
  mode: "BBPS" | "DIRECT" | "MANUAL";
  aggregator: string;
  status: "SANDBOX" | "ACTIVE" | "SUSPENDED";
  commissionType: "PER_TXN" | "PERCENT" | "PERCENT_SPLIT";
  settlementCycle: string;
  floatInr: number;
};

export type CollectionsSummary = {
  licenses: number;
  activeLicenses: number;
  collectedInr: number;
  commissionInr: number;
  pendingRemitInr: number;
  remittedInr: number;
  floatInr: number;
  byDiscom: { discom: string; mode: string; status: string; collectedInr: number; commissionInr: number }[];
};

export type WorklistItem = {
  billId: string;
  asset: string;
  buildingId: string | null;
  discom: string;
  consumerNumber: string;
  amountInr: number;
  dueOn: string | null;
  daysOverdue: number;
  licenseId: string | null;
};

const FIXTURE_SUMMARY: CollectionsSummary = {
  licenses: 4,
  activeLicenses: 2,
  collectedInr: 935000,
  commissionInr: 44500,
  pendingRemitInr: 455000,
  remittedInr: 480000,
  floatInr: 24000,
  byDiscom: [
    { discom: "MSEDCL", mode: "DIRECT", status: "ACTIVE", collectedInr: 785000, commissionInr: 43500 },
    { discom: "UPPCL", mode: "DIRECT", status: "ACTIVE", collectedInr: 150000, commissionInr: 200 },
    { discom: "BESCOM", mode: "BBPS", status: "SANDBOX", collectedInr: 0, commissionInr: 0 },
    { discom: "TANGEDCO", mode: "BBPS", status: "SANDBOX", collectedInr: 0, commissionInr: 0 },
  ],
};

const FIXTURE_LICENSES: LicenseRow[] = [
  { id: "lic-msedcl", discom: "MSEDCL", mode: "DIRECT", aggregator: "mahadiscom-portal", status: "ACTIVE", commissionType: "PERCENT_SPLIT", settlementCycle: "DAILY", floatInr: 24000 },
  { id: "lic-uppcl", discom: "UPPCL", mode: "DIRECT", aggregator: "upcscbls", status: "ACTIVE", commissionType: "PERCENT", settlementCycle: "DAILY", floatInr: 0 },
  { id: "lic-bescom", discom: "BESCOM", mode: "BBPS", aggregator: "billavenue", status: "SANDBOX", commissionType: "PER_TXN", settlementCycle: "T+1", floatInr: 0 },
  { id: "lic-tangedco", discom: "TANGEDCO", mode: "BBPS", aggregator: "setu", status: "SANDBOX", commissionType: "PER_TXN", settlementCycle: "T+1", floatInr: 0 },
];

const FIXTURE_WORKLIST: WorklistItem[] = [
  { billId: "w1", asset: "CoolChain Cold Storage", buildingId: "coolchain-cold", discom: "TANGEDCO", consumerNumber: "TN-44182", amountInr: 1284000, dueOn: "2026-05-20T00:00:00.000Z", daysOverdue: 20, licenseId: "lic-tangedco" },
  { billId: "w2", asset: "Riverside Mall", buildingId: "riverside-mall", discom: "BESCOM", consumerNumber: "BLR-90233", amountInr: 3650000, dueOn: "2026-05-28T00:00:00.000Z", daysOverdue: 12, licenseId: "lic-bescom" },
  { billId: "w3", asset: "Acme Bhosari Plant", buildingId: "acme-bhosari", discom: "MSEDCL", consumerNumber: "0123456789", amountInr: 1500000, dueOn: "2026-06-13T00:00:00.000Z", daysOverdue: 0, licenseId: "lic-msedcl" },
];

export type CollectionResult = { id: string; status: string; commissionInr: number } | null;

export const collections = {
  async summary(): Promise<CollectionsSummary> {
    if (liveServer()) {
      try { return await apiFetch<CollectionsSummary>("/v1/collections/summary", NO_STORE); } catch { /* fall back */ }
    }
    return FIXTURE_SUMMARY;
  },
  async licenses(): Promise<LicenseRow[]> {
    if (liveServer()) {
      try { return await apiFetch<LicenseRow[]>("/v1/collections/licenses", NO_STORE); } catch { /* fall back */ }
    }
    return FIXTURE_LICENSES.map((l) => ({ ...l }));
  },
  async worklist(): Promise<WorklistItem[]> {
    if (liveServer()) {
      try { return await apiFetch<WorklistItem[]>("/v1/collections/worklist", NO_STORE); } catch { /* fall back */ }
    }
    return FIXTURE_WORKLIST.map((w) => ({ ...w }));
  },

  /** Record a consumer payment (idempotent). Persists on a live backend; null on the static demo. */
  async record(input: {
    licenseId: string;
    billId?: string;
    consumerNumber?: string;
    amountInr: number;
    isOutstanding?: boolean;
    method: string;
    idempotencyKey: string;
  }): Promise<CollectionResult> {
    if (!isApiConfigured()) return null;
    try {
      return await apiFetch<CollectionResult>("/v1/collections", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch {
      return null;
    }
  },

  async remit(licenseId: string): Promise<unknown> {
    if (!isApiConfigured()) return null;
    try {
      return await apiFetch(`/v1/collections/licenses/${licenseId}/remit`, { method: "POST" });
    } catch {
      return null;
    }
  },
};
