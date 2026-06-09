/**
 * IEX provider dispatch. The indicative reference is always available; a real
 * feed is used when IEX_PROVIDER=http and IEX_BASE_URL are set. The service
 * falls back to the reference if a live fetch fails, so the dashboard always
 * renders (with an honest `source` flag telling the UI which it is).
 */

import { type IexQuote, providerName } from "./iex-core";
import { iexMockQuote } from "./provider-mock";
import { fetchViaHttp, iexHttpConfigured } from "./provider-http";

export { providerName } from "./iex-core";

/** Is a real, credentialed feed available? (the reference is always available). */
export function isConfigured(): boolean {
  return providerName() === "http" ? iexHttpConfigured() : true;
}

export async function getIexQuote(): Promise<IexQuote> {
  return providerName() === "http" ? fetchViaHttp() : iexMockQuote();
}

export { iexMockQuote };
export type { IexQuote };
