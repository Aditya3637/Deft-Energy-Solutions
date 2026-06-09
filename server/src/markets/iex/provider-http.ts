import { IexError, mapIexResponse, type IexQuote } from "./iex-core";

export function iexHttpConfigured(): boolean {
  return !!process.env.IEX_BASE_URL?.trim();
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/** Fetch the day-ahead price curve from the configured market-data endpoint. */
export async function fetchViaHttp(): Promise<IexQuote> {
  if (!iexHttpConfigured()) {
    throw new IexError("IEX provider not configured (set IEX_BASE_URL).", 503);
  }
  const url = process.env.IEX_BASE_URL!.trim();
  const key = process.env.IEX_API_KEY?.trim();

  let json: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { ...(key ? { authorization: `Bearer ${key}` } : {}) },
    });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      if (RETRYABLE.has(res.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      const msg = (j && typeof j.message === "string" && j.message) || `${res.status} ${res.statusText}`;
      throw new IexError(`IEX API error: ${msg}`, res.status);
    }
    json = j ?? {};
    break;
  }
  if (!json) throw new IexError("Empty response from IEX API");
  return mapIexResponse(json);
}
