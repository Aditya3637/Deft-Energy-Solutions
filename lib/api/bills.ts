import * as M from "@/lib/mock/bill";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

export type { ExtractedField, FieldGroup } from "@/lib/mock/bill";
export const GROUP_ORDER = M.GROUP_ORDER;

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

export type SaveResult = { saved: boolean; bill?: unknown };

export const bills = {
  /** The sample bill returned by the preview "extraction" (Stage G: real OCR). */
  sample: async (): Promise<M.ExtractedField[]> => M.SAMPLE_FIELDS.map((f) => ({ ...f })),

  /**
   * Persist a bill (and its server-side diagnosis) via POST /v1/bills when a
   * backend is configured; otherwise a no-op "demo save". Same signature both ways.
   */
  async create(fields: M.ExtractedField[]): Promise<SaveResult> {
    if (!isApiConfigured()) return { saved: false };
    const bill = await apiFetch<unknown>("/v1/bills", {
      method: "POST",
      body: JSON.stringify(fieldsToBillPayload(fields)),
    });
    return { saved: true, bill };
  },
};
