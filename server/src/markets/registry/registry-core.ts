/**
 * Carbon-credit (CCTS) registry feed — shared types + pure mapping.
 *
 * Provider seam (mirrors the OCR / BBPS / IEX adapters). With no account we
 * report 0 actual holdings and the UI shows the *estimated potential* computed
 * from avoided emissions; a real registry account returns the org's held /
 * retired certificates. Env:
 *   REGISTRY_PROVIDER=http                  (default: estimated, no holdings)
 *   REGISTRY_BASE_URL=<registry endpoint>
 *   REGISTRY_API_KEY=<key>                   (sent as Bearer)
 *
 * `mapRegistryResponse` is pure and CI-tested.
 */

export type CreditHoldings = {
  held: number;
  retired: number;
  ccPriceINR: number;
  asOf: string;
  /** "registry" = live holdings · "estimated" = no registry, potential only. */
  source: "registry" | "estimated";
};

export class RegistryError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

/** Indicative CCTS spot price (₹ per certificate) when the feed omits one. */
export const CCC_INDICATIVE_INR = 1450;

export function providerName(): "http" | "mock" {
  return process.env.REGISTRY_PROVIDER?.trim().toLowerCase() === "http" ? "http" : "mock";
}

function field(body: Record<string, unknown>, keys: string[]): unknown {
  const scopes: unknown[] = [body, body.data, body.result, body.holdings];
  for (const scope of scopes) {
    if (scope && typeof scope === "object") {
      const rec = scope as Record<string, unknown>;
      for (const k of keys) if (rec[k] != null) return rec[k];
    }
  }
  return undefined;
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Map a registry API response to holdings. Pure — CI-testable. */
export function mapRegistryResponse(body: Record<string, unknown>): CreditHoldings {
  const asOf = field(body, ["asOf", "timestamp", "date"]);
  return {
    held: Math.max(0, Math.round(num(field(body, ["held", "balance", "creditsHeld", "available"])))),
    retired: Math.max(0, Math.round(num(field(body, ["retired", "creditsRetired", "surrendered"])))),
    ccPriceINR: Math.max(0, Math.round(num(field(body, ["price", "ccPriceINR", "spot", "lastPrice"]), CCC_INDICATIVE_INR))),
    asOf: asOf != null ? String(asOf) : new Date().toISOString(),
    source: "registry",
  };
}
