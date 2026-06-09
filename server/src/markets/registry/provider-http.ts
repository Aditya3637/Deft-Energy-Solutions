import { mapRegistryResponse, RegistryError, type CreditHoldings } from "./registry-core";

export function registryHttpConfigured(): boolean {
  return !!process.env.REGISTRY_BASE_URL?.trim();
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * Fetch the org's credit holdings from the configured registry. The org's
 * registry account id is passed as a query param so the feed can scope results.
 */
export async function fetchHoldings(orgRef: string): Promise<CreditHoldings> {
  if (!registryHttpConfigured()) {
    throw new RegistryError("Registry provider not configured (set REGISTRY_BASE_URL).", 503);
  }
  const base = process.env.REGISTRY_BASE_URL!.trim();
  const key = process.env.REGISTRY_API_KEY?.trim();
  const url = `${base}${base.includes("?") ? "&" : "?"}account=${encodeURIComponent(orgRef)}`;

  let json: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { ...(key ? { authorization: `Bearer ${key}` } : {}) } });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      if (RETRYABLE.has(res.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      const msg = (j && typeof j.message === "string" && j.message) || `${res.status} ${res.statusText}`;
      throw new RegistryError(`Registry API error: ${msg}`, res.status);
    }
    json = j ?? {};
    break;
  }
  if (!json) throw new RegistryError("Empty response from registry API");
  return mapRegistryResponse(json);
}
