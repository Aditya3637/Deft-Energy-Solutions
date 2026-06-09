import { CCC_INDICATIVE_INR, type CreditHoldings } from "./registry-core";

/**
 * No registry account → no actual holdings. The carbon-credits view then shows
 * the *estimated potential* (from avoided emissions) instead of held/retired.
 */
export function registryMockHoldings(): CreditHoldings {
  return { held: 0, retired: 0, ccPriceINR: CCC_INDICATIVE_INR, asOf: "estimated", source: "estimated" };
}
