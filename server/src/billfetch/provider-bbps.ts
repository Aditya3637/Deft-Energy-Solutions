/**
 * Generic BBPS aggregator adapter (raw fetch, no SDK). BBPS itself is NPCI-run;
 * in practice you reach it through a paid aggregator (Setu/Pine Labs, Cashfree,
 * Razorpay, Decentro, Zoop, …) that exposes a "fetch bill" endpoint.
 *
 * Aggregator contracts differ, so this is a TEMPLATE: it POSTs the biller + the
 * customer params to BILLFETCH_BASE_URL and maps common response field names. A
 * real deployment will likely tweak the request body and response paths to one
 * aggregator. Env:
 *   BILLFETCH_PROVIDER=bbps
 *   BILLFETCH_BASE_URL=<aggregator fetch-bill endpoint>
 *   BILLFETCH_API_KEY=<aggregator key>           (sent as Bearer; override header below if needed)
 *   BILLFETCH_AMOUNT_IN_PAISE=1                   (set if the aggregator returns amounts in paise)
 */

import type { RawField } from "../extract/extract-core";
import type { Biller } from "./biller-catalog";
import { BillFetchError } from "./billfetch-core";

export function bbpsConfigured(): boolean {
  return !!process.env.BILLFETCH_BASE_URL?.trim();
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/** Look up a key across the response and a few common envelope wrappers. */
function pick(body: Record<string, unknown>, keys: string[]): string | undefined {
  const scopes: unknown[] = [
    body,
    body.data,
    body.result,
    (body.data as Record<string, unknown> | undefined)?.billerResponse,
    body.billerResponse,
  ];
  for (const scope of scopes) {
    if (scope && typeof scope === "object") {
      const rec = scope as Record<string, unknown>;
      for (const k of keys) {
        const v = rec[k];
        if (v != null && v !== "") return String(v);
      }
    }
  }
  return undefined;
}

/** YYYY-MM-DD → DD-MM-YYYY; otherwise pass through. */
function normaliseDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

export async function fetchViaBbps(
  biller: Biller,
  params: Record<string, string>,
): Promise<RawField[]> {
  if (!bbpsConfigured()) {
    throw new BillFetchError("BBPS provider not configured (set BILLFETCH_BASE_URL).", 503);
  }
  const url = process.env.BILLFETCH_BASE_URL!.trim();
  const key = process.env.BILLFETCH_API_KEY?.trim();
  const inPaise = !!process.env.BILLFETCH_AMOUNT_IN_PAISE?.trim();

  const body = JSON.stringify({
    billerId: biller.bbpsBillerId ?? biller.id,
    biller: biller.id,
    customerParams: params,
    ...params, // some aggregators want the params flat as well
  });

  let body_json: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body,
    });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const msg =
        (j && typeof j.message === "string" && j.message) || `${res.status} ${res.statusText}`;
      if (RETRYABLE.has(res.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw new BillFetchError(`Bill-fetch API error: ${msg}`, res.status);
    }
    body_json = j ?? {};
    break;
  }
  if (!body_json) throw new BillFetchError("Empty response from bill-fetch API");

  const fields: RawField[] = [];
  const add = (k: string, v: string | undefined) => {
    if (v && v.trim()) fields.push({ key: k, value: v.trim(), confidence: 0.99 });
  };

  add("consumerNumber", pick(body_json, ["consumerNumber", "customerId", "ca", "caNumber"]) ?? params.consumerNumber);
  add("consumerName", pick(body_json, ["customerName", "consumerName", "name"]));
  add("discom", biller.discom);
  let amount = pick(body_json, ["billAmount", "amount", "dueAmount", "billNetAmount", "netAmount"]);
  if (amount && inPaise) {
    const n = Number(amount.replace(/[^0-9.\-]/g, ""));
    if (Number.isFinite(n)) amount = String(n / 100);
  }
  add("totalAmountDue", amount);
  add("billDate", normaliseDate(pick(body_json, ["billDate", "billGenerationDate", "billGenDate"])));
  add("dueDate", normaliseDate(pick(body_json, ["dueDate", "billDueDate", "paymentDueDate"])));
  add("energyKwh", pick(body_json, ["unitsConsumed", "consumption", "energyKwh", "units"]));

  return fields;
}
