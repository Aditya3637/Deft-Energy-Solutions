import * as M from "@/lib/mock/bill";
import { getApiBase, isApiConfigured } from "@/lib/api/client";

export type { ExtractedField } from "@/lib/mock/bill";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export type BillerParam = { name: string; label: string; placeholder?: string };
export type Biller = { id: string; discom: string; state: string; params: BillerParam[] };

/** Built-in fallback so the picker works on the static demo (no live backend). */
const FALLBACK_BILLERS: Biller[] = [
  { id: "msedcl", discom: "MSEDCL (Mahavitaran)", state: "Maharashtra", params: [{ name: "consumerNumber", label: "Consumer number", placeholder: "12-digit consumer no." }] },
  { id: "bescom", discom: "BESCOM", state: "Karnataka", params: [{ name: "consumerNumber", label: "Account ID", placeholder: "account ID" }] },
  { id: "tangedco", discom: "TANGEDCO", state: "Tamil Nadu", params: [{ name: "consumerNumber", label: "Consumer number" }] },
  { id: "tpddl", discom: "Tata Power-DDL", state: "Delhi", params: [{ name: "consumerNumber", label: "CA number", placeholder: "CA number" }] },
  { id: "adani-mumbai", discom: "Adani Electricity Mumbai", state: "Maharashtra", params: [{ name: "consumerNumber", label: "Consumer number" }] },
];

export type FetchOutcome =
  | { ok: true; fields: M.ExtractedField[]; note: string; billerName: string }
  | { ok: false; note: string };

type ServerBillers = { billers: Biller[]; configured: boolean };
type ServerFetch = {
  fields: M.ExtractedField[];
  billerName: string;
  found: number;
  total: number;
  source: "bbps" | "bbps-demo";
  provider: string;
  summary: true;
};

export const billfetch = {
  /** DISCOM catalog for the picker (live when configured, else a built-in list). */
  async billers(): Promise<{ billers: Biller[]; configured: boolean }> {
    if (!isApiConfigured()) return { billers: FALLBACK_BILLERS, configured: false };
    try {
      const res = await fetch(`${getApiBase()}/v1/billfetch/billers`, {
        headers: { "x-org-id": DEMO_ORG_ID },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as ServerBillers;
        if (Array.isArray(data.billers) && data.billers.length) return data;
      }
    } catch {
      /* fall back */
    }
    return { billers: FALLBACK_BILLERS, configured: false };
  },

  /** Fetch a bill summary by biller + customer params (BBPS-style channel). */
  async fetch(billerId: string, params: Record<string, string>): Promise<FetchOutcome> {
    if (!isApiConfigured()) {
      return { ok: false, note: "No live backend configured — bill fetch needs the server running." };
    }
    try {
      const res = await fetch(`${getApiBase()}/v1/billfetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-org-id": DEMO_ORG_ID },
        body: JSON.stringify({ billerId, params }),
      });
      if (!res.ok) {
        let msg = `Fetch failed (${res.status}).`;
        try {
          const b = (await res.json()) as { message?: string };
          if (b?.message) msg = b.message;
        } catch {
          /* keep default */
        }
        return { ok: false, note: msg };
      }
      const data = (await res.json()) as ServerFetch;
      const note =
        data.source === "bbps-demo"
          ? `Demo data for ${data.billerName} — connect a BBPS aggregator for live fetch. BBPS returns a summary; upload the full bill for the 58-check diagnosis.`
          : `Fetched a summary from ${data.billerName} via BBPS. For the full 58-check diagnosis, also upload the detailed bill.`;
      return { ok: true, fields: data.fields, note, billerName: data.billerName };
    } catch {
      return { ok: false, note: "Couldn't reach the bill-fetch service." };
    }
  },
};
