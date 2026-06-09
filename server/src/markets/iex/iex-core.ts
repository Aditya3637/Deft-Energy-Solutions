/**
 * IEX / power-exchange day-ahead price feed — shared types + pure mapping.
 *
 * Provider seam (mirrors the OCR / BBPS adapters): a built-in INDICATIVE
 * reference works with no account; a real market-data provider activates the
 * moment it is configured. Env:
 *   IEX_PROVIDER=http                       (default: indicative reference)
 *   IEX_BASE_URL=<day-ahead price endpoint>
 *   IEX_API_KEY=<key>                        (sent as Bearer)
 *
 * The mapping (`mapIexResponse`) is pure and exported so CI can verify it
 * without a network — the same discipline as the rest of the codebase.
 */

export type IexBlock = { h: string; p: number };

export type IexQuote = {
  lastMcpINR: number;
  dayAvgINR: number;
  peakINR: number;
  offPeakINR: number;
  blocks: IexBlock[];
  asOf: string;
  /** "iex" = live exchange feed · "indicative" = built-in reference. */
  source: "iex" | "indicative";
};

export class IexError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "IexError";
  }
}

/** Provider selection: "http" (configured feed) | "mock" (indicative reference). */
export function providerName(): "http" | "mock" {
  return process.env.IEX_PROVIDER?.trim().toLowerCase() === "http" ? "http" : "mock";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Aggregate headline numbers from a block series. */
export function aggregates(blocks: IexBlock[]): Pick<IexQuote, "lastMcpINR" | "dayAvgINR" | "peakINR" | "offPeakINR"> {
  if (blocks.length === 0) {
    return { lastMcpINR: 0, dayAvgINR: 0, peakINR: 0, offPeakINR: 0 };
  }
  const prices = blocks.map((b) => b.p);
  return {
    lastMcpINR: round2(prices[prices.length - 1]),
    dayAvgINR: round2(prices.reduce((a, b) => a + b, 0) / prices.length),
    peakINR: round2(Math.max(...prices)),
    offPeakINR: round2(Math.min(...prices)),
  };
}

/** Read a key across a few common envelope shapes. */
function field(body: Record<string, unknown>, keys: string[]): unknown {
  const scopes: unknown[] = [body, body.data, body.result];
  for (const scope of scopes) {
    if (scope && typeof scope === "object") {
      const rec = scope as Record<string, unknown>;
      for (const k of keys) if (rec[k] != null) return rec[k];
    }
  }
  return undefined;
}

/** Map a market-data API response to an IexQuote. Pure — CI-testable. */
export function mapIexResponse(body: Record<string, unknown>): IexQuote {
  const rawBlocks = (field(body, ["blocks", "priceBlocks", "dam", "series", "prices"]) ?? []) as unknown[];
  const blocks: IexBlock[] = (Array.isArray(rawBlocks) ? rawBlocks : [])
    .map((b) => {
      const rec = (b ?? {}) as Record<string, unknown>;
      const h = rec.h ?? rec.hour ?? rec.timeBlock ?? rec.time ?? rec.block;
      const p = rec.p ?? rec.price ?? rec.mcp ?? rec.priceRs ?? rec.value;
      const pn = Number(p);
      return { h: String(h ?? "").padStart(2, "0").slice(0, 2), p: Number.isFinite(pn) ? round2(pn) : 0 };
    })
    .filter((b) => b.h !== "");

  const asOfRaw = field(body, ["asOf", "timestamp", "tradeDate", "date"]);
  return {
    ...aggregates(blocks),
    blocks,
    asOf: asOfRaw != null ? String(asOfRaw) : new Date().toISOString(),
    source: "iex",
  };
}
