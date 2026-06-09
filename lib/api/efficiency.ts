import { cache } from "react";

import * as M from "@/lib/mock/efficiency";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export type { EcmResult, EfficiencyResult } from "@/lib/mock/efficiency";

/**
 * Efficiency (ECM) potential, derived server-side from the org's real
 * consumption. Live on Vercel SSR; fixture on the static build / off-server.
 */
const fetchEfficiency = cache(async (): Promise<M.EfficiencyResult> => {
  if (!liveServer()) return M.EFFICIENCY_FIXTURE;
  try {
    return await apiFetch<M.EfficiencyResult>("/v1/efficiency", NO_STORE);
  } catch {
    return M.EFFICIENCY_FIXTURE;
  }
});

export const efficiency = {
  potential: (): Promise<M.EfficiencyResult> => fetchEfficiency(),
};
