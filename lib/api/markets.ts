import { cache } from "react";

import * as M from "@/lib/mock/energy-markets";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export { oaEconomics } from "@/lib/mock/energy-markets";
export type { OpenAccessData } from "@/lib/mock/energy-markets";

type GhgScopes = typeof M.GHG_SCOPES;
type OA = typeof M.OA;
type CarbonCredits = typeof M.CARBON_CREDITS;
type Bess = typeof M.BESS;
type Microgrid = typeof M.MICROGRID;
type Vpp = typeof M.VPP;

/**
 * Each breadth endpoint is fetched once per render (React `cache` dedupes the
 * several seam calls a page makes). All fall back to the deterministic fixture
 * off-server or on error, so the static export and anonymous demo keep working.
 *
 * IEX day-ahead prices stay a fixture: they are external market data with no
 * live feed until the IEX integration (Stage G) — the UI labels them indicative.
 */
const fetchCarbon = cache(async (): Promise<GhgScopes | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<GhgScopes>("/v1/carbon", NO_STORE);
  } catch {
    return null;
  }
});

const fetchMarkets = cache(async (): Promise<{ openAccess: OA; carbonCredits: CarbonCredits } | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<{ openAccess: OA; carbonCredits: CarbonCredits }>("/v1/markets", NO_STORE);
  } catch {
    return null;
  }
});

const fetchAssets = cache(async (): Promise<{ bess: Bess; microgrid: Microgrid; vpp: Vpp } | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<{ bess: Bess; microgrid: Microgrid; vpp: Vpp }>("/v1/assets", NO_STORE);
  } catch {
    return null;
  }
});

type Iex = typeof M.IEX;
const fetchIex = cache(async (): Promise<Iex | null> => {
  if (!liveServer()) return null;
  try {
    // Live exchange feed when configured (IEX_PROVIDER=http); else the backend
    // returns the indicative reference with source="indicative".
    return await apiFetch<Iex>("/v1/markets/iex", NO_STORE);
  } catch {
    return null;
  }
});

export const markets = {
  ghgScopes: async (): Promise<GhgScopes> => (await fetchCarbon()) ?? M.GHG_SCOPES,
  openAccess: async (): Promise<OA> => (await fetchMarkets())?.openAccess ?? M.OA,
  carbonCredits: async (): Promise<CarbonCredits> => (await fetchMarkets())?.carbonCredits ?? M.CARBON_CREDITS,
  iex: async (): Promise<Iex> => (await fetchIex()) ?? M.IEX,
  bess: async (): Promise<Bess> => (await fetchAssets())?.bess ?? M.BESS,
  microgrid: async (): Promise<Microgrid> => (await fetchAssets())?.microgrid ?? M.MICROGRID,
  vpp: async (): Promise<Vpp> => (await fetchAssets())?.vpp ?? M.VPP,
};
