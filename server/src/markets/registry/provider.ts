/**
 * Carbon-credit registry dispatch. Estimated (no holdings) is the default; a
 * live registry is used when REGISTRY_PROVIDER=http and REGISTRY_BASE_URL are
 * set. The service falls back to estimated if a live fetch fails.
 */

import { type CreditHoldings, providerName } from "./registry-core";
import { registryMockHoldings } from "./provider-mock";
import { fetchHoldings, registryHttpConfigured } from "./provider-http";

export { providerName } from "./registry-core";

export function isConfigured(): boolean {
  return providerName() === "http" ? registryHttpConfigured() : true;
}

export async function getHoldings(orgRef: string): Promise<CreditHoldings> {
  return providerName() === "http" ? fetchHoldings(orgRef) : registryMockHoldings();
}

export { registryMockHoldings };
export type { CreditHoldings };
