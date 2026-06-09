/**
 * Shared types + helpers for the BBPS-style fetch channel.
 *
 * BBPS bill-fetch returns a SUMMARY (amount due, due date, customer name, bill
 * date/number) — not the 42 itemised fields. It's ideal for validation and the
 * collections flow; full diagnosis still needs the detailed bill (upload/OCR).
 */

import type { RawField } from "../extract/extract-core";

export class BillFetchError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "BillFetchError";
  }
}

export type FetchRequest = { billerId: string; params: Record<string, string> };

/** Source tag: a real aggregator vs the built-in demo stub. */
export type FetchSource = "bbps" | "bbps-demo";

export type FetchOutcome = {
  fields: RawField[];
  billerName: string;
  source: FetchSource;
  provider: string;
};

/** Provider selection: "mock" (default demo) | "bbps" (configured aggregator). */
export function providerName(): "mock" | "bbps" {
  return process.env.BILLFETCH_PROVIDER?.trim().toLowerCase() === "bbps" ? "bbps" : "mock";
}
