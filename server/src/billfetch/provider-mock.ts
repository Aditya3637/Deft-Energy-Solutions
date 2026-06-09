/**
 * Demo bill-fetch stub. Returns a clearly-labelled SAMPLE summary so the fetch
 * channel works end-to-end without an aggregator account. The consumer number
 * the user typed is echoed back; everything else is illustrative. The UI flags
 * this as demo data.
 */

import type { RawField } from "../extract/extract-core";
import type { Biller } from "./biller-catalog";

export function fetchViaMock(biller: Biller, params: Record<string, string>): RawField[] {
  const consumerNumber = (params.consumerNumber ?? "").trim() || "0123456789";
  // A plausible monthly summary — the fields BBPS actually returns.
  return [
    { key: "consumerNumber", value: consumerNumber, confidence: 0.99 },
    { key: "consumerName", value: "Sample Consumer (demo)", confidence: 0.99 },
    { key: "discom", value: biller.discom, confidence: 0.99 },
    { key: "totalAmountDue", value: "184260", confidence: 0.99 },
    { key: "billDate", value: "02-06-2026", confidence: 0.99 },
    { key: "dueDate", value: "17-06-2026", confidence: 0.99 },
    { key: "energyKwh", value: "21450", confidence: 0.99 },
  ];
}
