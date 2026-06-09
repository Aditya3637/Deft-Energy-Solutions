import { cache } from "react";

import * as M from "@/lib/mock/billing";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export type { Plan, PlanId, Feature, BillingStatus } from "@/lib/mock/billing";
export { UNLIMITED } from "@/lib/mock/billing";

/**
 * Billing seam. The plan catalog and the org's live plan/usage come from the
 * backend on Vercel SSR; off-server (static export / anonymous demo) they fall
 * back to the fixture so the pricing page and settings always render.
 */
const fetchPlans = cache(async (): Promise<M.Plan[]> => {
  if (!liveServer()) return M.PLANS;
  try {
    return await apiFetch<M.Plan[]>("/v1/billing/plans", NO_STORE);
  } catch {
    return M.PLANS;
  }
});

const fetchStatus = cache(async (): Promise<M.BillingStatus> => {
  if (!liveServer()) return M.DEFAULT_STATUS;
  try {
    return await apiFetch<M.BillingStatus>("/v1/billing", NO_STORE);
  } catch {
    return M.DEFAULT_STATUS;
  }
});

export const billing = {
  plans: (): Promise<M.Plan[]> => fetchPlans(),
  status: (): Promise<M.BillingStatus> => fetchStatus(),
};
