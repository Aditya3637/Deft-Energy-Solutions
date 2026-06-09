import * as M from "@/lib/mock/bill";
import { ApiError, apiFetch, isApiConfigured, liveServer, NO_STORE } from "@/lib/api/client";

export type { ExtractedField, FieldGroup } from "@/lib/mock/bill";
export const GROUP_ORDER = M.GROUP_ORDER;

/** A bill the user saved to their workspace, with its diagnosed savings. */
export type SavedBill = {
  id: string;
  buildingId: string | null;
  title: string;
  discom: string;
  month: string;
  amountInr: number;
  recoverableInr: number | null;
  analyzed: boolean;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "DD-MM-YYYY" → "Mon YYYY" for display. */
function billMonth(billDate: string | null): string {
  const m = billDate?.match(/^\d{2}-(\d{2})-(\d{4})/);
  return m ? `${MONTHS[Number(m[1]) - 1] ?? "?"} ${m[2]}` : "—";
}

type ServerBill = {
  id: string;
  buildingId: string | null;
  consumerName: string | null;
  discom: string | null;
  totalAmountDue: number | null;
  billDate: string | null;
  diagnosis: { recoverableInr: number; opportunityInr: number } | null;
};

/** Demo analyzed bills for the static Pages build (Vercel SSR shows the real ones). */
const SAVED_FIXTURE: SavedBill[] = [
  { id: "fx-1", buildingId: "acme-bhosari", title: "Acme Manufacturing Pvt Ltd", discom: "MSEDCL", month: "Jun 2026", amountInr: 4484210, recoverableInr: 2606000, analyzed: true },
];

/** Bill fields that are text (everything else is sent as a number). */
const STRING_KEYS = new Set([
  "consumerNumber", "consumerName", "address", "discom", "tariffCategory",
  "supplyVoltage", "mdDateTime", "billDate", "dueDate", "meterNumber",
]);

/** Project the editable ExtractedField[] into the server's CreateBill payload. */
function fieldsToBillPayload(fields: M.ExtractedField[]): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const f of fields) {
    const v = f.value?.trim();
    if (!v) continue;
    if (STRING_KEYS.has(f.key)) {
      out[f.key] = v;
    } else {
      const n = Number(v.replace(/,/g, ""));
      if (Number.isFinite(n)) out[f.key] = n;
    }
  }
  return out;
}

/** When a signed-in org is over its plan quota the server returns 402. */
export type PlanLimit = { reason?: string; upgradeTo?: "PRO" | "ENTERPRISE" };
export type SaveResult = { saved: boolean; bill?: unknown; limitReached?: boolean; limit?: PlanLimit };

export const bills = {
  /** The sample bill returned by the preview "extraction" (Stage G: real OCR). */
  sample: async (): Promise<M.ExtractedField[]> => M.SAMPLE_FIELDS.map((f) => ({ ...f })),

  /**
   * Persist a bill (and its server-side diagnosis) via POST /v1/bills when a
   * backend is configured; otherwise a no-op "demo save". Same signature both ways.
   */
  async create(fields: M.ExtractedField[]): Promise<SaveResult> {
    if (!isApiConfigured()) return { saved: false };
    try {
      const bill = await apiFetch<unknown>("/v1/bills", {
        method: "POST",
        body: JSON.stringify(fieldsToBillPayload(fields)),
      });
      return { saved: true, bill };
    } catch (e) {
      // 402 = plan quota reached → surface the upgrade path instead of a dead-end.
      if (e instanceof ApiError && e.status === 402) {
        const b = (e.body ?? {}) as { reason?: string; upgradeTo?: "PRO" | "ENTERPRISE" };
        return { saved: false, limitReached: true, limit: { reason: b.reason, upgradeTo: b.upgradeTo } };
      }
      throw e;
    }
  },

  /**
   * The user's saved + analyzed bills (with diagnosed recoverable ₹). Live on
   * Vercel SSR; the static Pages build shows the demo fixture. This is what
   * closes the core loop — the savings you found on /analyze show up here.
   */
  async listAnalyzed(): Promise<SavedBill[]> {
    if (liveServer()) {
      try {
        const rows = await apiFetch<ServerBill[]>("/v1/bills", NO_STORE);
        return rows
          .map((b) => ({
            id: b.id,
            buildingId: b.buildingId,
            title: b.consumerName ?? "Bill",
            discom: b.discom ?? "—",
            month: billMonth(b.billDate),
            amountInr: Math.round(b.totalAmountDue ?? 0),
            recoverableInr: b.diagnosis ? Math.round(b.diagnosis.recoverableInr) : null,
            analyzed: !!b.diagnosis,
          }))
          .filter((b) => b.analyzed); // only diagnosed bills (not payment-tracking rows)
      } catch {
        /* fall back */
      }
    }
    return SAVED_FIXTURE.map((b) => ({ ...b }));
  },
};
