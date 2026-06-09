/**
 * BBPS Agent-Institution connector (real rail). Implemented against the Setu
 * Bharat Connect API shape — OAuth token at the COU base, async fetch/pay
 * (request → poll response), amounts in PAISE. Other aggregators (Cashfree,
 * BillAvenue, PayU) follow the same operation shape; the env + the tolerant
 * field mapping below are the only things that change.
 *
 * ⚠️ Activated only when `COLLECTIONS_LIVE` is set and credentials exist. The
 * EXACT field names / endpoints must be confirmed against the chosen
 * aggregator's live docs during certification (PLAN §7, G7.4) — they vary by
 * partner and version. Until then this stays dormant and `mock` is used; it
 * has not been run against a live sandbox from here.
 *
 * Env:
 *   COLLECTIONS_LIVE=1
 *   BBPS_BASE_URL=https://sandbox-coudc.setu.co     (UAT/sandbox; prod differs)
 *   BBPS_CLIENT_ID=...                              (issued after agent onboarding/UAT)
 *   BBPS_CLIENT_SECRET=...
 *   BBPS_PRODUCT_INSTANCE_ID=...                    (Setu product instance)
 *   BBPS_AGENT_ID=...                               (agent / outlet id)
 */

import type { PayBillRequest, PayBillResult } from "./connector";

const baseUrl = () => (process.env.BBPS_BASE_URL?.trim() || "https://sandbox-coudc.setu.co").replace(/\/$/, "");

export function bbpsConfigured(): boolean {
  return !!process.env.BBPS_CLIENT_ID?.trim() && !!process.env.BBPS_CLIENT_SECRET?.trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- token (client-credentials), cached until shortly before expiry ----------
let cached: { token: string; expMs: number } | null = null;

async function token(): Promise<string> {
  if (cached && cached.expMs > Date.now() + 30_000) return cached.token;
  const res = await fetch(`${baseUrl()}/api/v2/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      clientID: process.env.BBPS_CLIENT_ID,
      secret: process.env.BBPS_CLIENT_SECRET,
    }),
  });
  const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !j) throw new Error(`BBPS auth failed: ${res.status}`);
  const data = (j.data as Record<string, unknown>) ?? j;
  const tok = (data.token ?? (j as Record<string, unknown>).access_token) as string | undefined;
  if (!tok) throw new Error("BBPS auth: no token in response");
  const expiresInSec = Number(data.expiresIn ?? data.expires_in ?? 3600);
  cached = { token: tok, expMs: Date.now() + expiresInSec * 1000 };
  return tok;
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${await token()}`,
      ...(process.env.BBPS_PRODUCT_INSTANCE_ID ? { "X-Setu-Product-Instance-ID": process.env.BBPS_PRODUCT_INSTANCE_ID } : {}),
    },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new Error(`BBPS ${path} → ${res.status}: ${j ? JSON.stringify(j).slice(0, 200) : ""}`);
  return j ?? {};
}

/** Read a status string from various envelope shapes, normalise to our 3 states. */
function normaliseStatus(j: Record<string, unknown>): PayBillResult["status"] {
  const d = (j.data as Record<string, unknown>) ?? j;
  const raw = String(d.status ?? d.paymentStatus ?? d.billPaymentStatus ?? "").toUpperCase();
  if (/SUCCESS|COMPLETED|PAID/.test(raw)) return "SUCCESS";
  if (/FAIL|DECLIN|ERROR|REJECT/.test(raw)) return "FAILED";
  return "PENDING"; // PROCESSING / INITIATED / unknown
}
function refOf(j: Record<string, unknown>): string {
  const d = (j.data as Record<string, unknown>) ?? j;
  return String(d.refId ?? d.referenceId ?? d.transactionId ?? d.txnId ?? "");
}

export const bbpsConnector = {
  id: "bbps",

  /**
   * Bill payment via BBPS. request → poll response until terminal (bounded).
   * Idempotency: `referenceId` (our key) is sent as the txn reference so retries
   * dedupe at the aggregator. Never throws — returns FAILED on error so the
   * caller records the attempt without crashing.
   */
  async payBill(req: PayBillRequest): Promise<PayBillResult> {
    try {
      const reqJson = await post("/bbps/bills/pay/request", {
        billerId: req.billerId,
        customerParams: Object.entries(req.consumerParams).map(([attributeName, attributeValue]) => ({ attributeName, attributeValue })),
        amount: req.amountPaise, // paise
        paymentMode: "UPI",
        transactionReference: req.referenceId,
        agentId: process.env.BBPS_AGENT_ID,
      });
      const ref = refOf(reqJson) || req.referenceId;

      // Poll for a terminal status (sandbox usually resolves quickly).
      let last: Record<string, unknown> = reqJson;
      for (let i = 0; i < 5; i++) {
        const status = normaliseStatus(last);
        if (status !== "PENDING") return { providerRef: ref, status };
        await sleep(700);
        last = await post("/bbps/bills/pay/response", { refId: ref });
      }
      return { providerRef: ref, status: normaliseStatus(last) };
    } catch (err) {
      return { providerRef: "", status: "FAILED", message: err instanceof Error ? err.message : "BBPS pay error" };
    }
  },

  // On BBPS the aggregator settles to the biller (T+1); our remittance row just
  // records that. A real impl reconciles against the aggregator's settlement file.
  async remit(req: { discom: string; periodDate: string; grossPaise: number; commissionPaise: number; count: number }) {
    return { providerRef: `bbps-${req.discom}-${req.periodDate.slice(0, 10)}`, remittedPaise: req.grossPaise, settled: true };
  },
};
