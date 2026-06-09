import { cache } from "react";

import * as M from "@/lib/mock/sustainability";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export type { Obligation, ComplianceStatus, Risk, ExecOpportunity } from "@/lib/mock/sustainability";

/** Shape returned by GET /v1/compliance (server-derived from the org's data). */
type ServerScorecard = {
  obligations: M.Obligation[];
  brsr: { name: string; pct: number; auto: boolean }[];
  esg: { overall: number; environment: number; social: number; governance: number; percentile: string };
};

/**
 * Live compliance scorecard, fetched once per render (React `cache` dedupes the
 * obligations/brsrSections/esg calls the compliance & executive pages make).
 * Falls back to the deterministic fixture when no live server is configured or
 * the request fails — the page always renders.
 */
const fetchScorecard = cache(async (): Promise<ServerScorecard | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<ServerScorecard>("/v1/compliance", NO_STORE);
  } catch {
    return null;
  }
});

export const sustainability = {
  carbon: async () => M.CARBON,
  carbonTotal: async (): Promise<number> => M.CARBON_TOTAL,
  esg: async () => (await fetchScorecard())?.esg ?? M.ESG,
  netZero: async () => M.NET_ZERO,
  obligations: async (): Promise<M.Obligation[]> => (await fetchScorecard())?.obligations ?? M.OBLIGATIONS,
  brsrSections: async () => (await fetchScorecard())?.brsr ?? M.BRSR_SECTIONS,
  risks: async (): Promise<M.Risk[]> => M.RISKS,
  opportunities: async (): Promise<M.ExecOpportunity[]> => M.EXEC_OPPORTUNITIES,
};
