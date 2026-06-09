/**
 * Bill-fetch provider selection. BILLFETCH_PROVIDER: "mock" (default — built-in
 * demo summary, no account needed) | "bbps" (a configured aggregator).
 */

import type { RawField } from "../extract/extract-core";
import type { Biller } from "./biller-catalog";
import { type FetchSource, providerName } from "./billfetch-core";
import { fetchViaMock } from "./provider-mock";
import { bbpsConfigured, fetchViaBbps } from "./provider-bbps";

export { providerName } from "./billfetch-core";

/** Is a real, credentialed fetch available? (mock is always available as demo) */
export function isConfigured(): boolean {
  return providerName() === "bbps" ? bbpsConfigured() : true;
}

export function fetchSource(): FetchSource {
  return providerName() === "bbps" ? "bbps" : "bbps-demo";
}

export async function fetchBill(
  biller: Biller,
  params: Record<string, string>,
): Promise<RawField[]> {
  return providerName() === "bbps" ? fetchViaBbps(biller, params) : fetchViaMock(biller, params);
}
