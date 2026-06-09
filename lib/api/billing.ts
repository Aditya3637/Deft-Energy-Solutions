import { cache } from "react";

import * as M from "@/lib/mock/billing";
import { apiFetch, getSessionToken, isApiConfigured, liveServer, NO_STORE } from "@/lib/api/client";

export type { Plan, PlanId, Feature, BillingStatus, CheckoutResult } from "@/lib/mock/billing";
export { UNLIMITED } from "@/lib/mock/billing";

const POST = (plan: string) => ({
  method: "POST",
  body: JSON.stringify({ plan }), // apiFetch sets Content-Type + Authorization
  ...NO_STORE,
});

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

  isSignedIn: () => isApiConfigured() && !!getSessionToken(),

  /** Start a no-card 14-day Pro trial. Returns false if not signed in / already used / on error. */
  async startTrial(): Promise<boolean> {
    if (!isApiConfigured()) return false;
    try {
      await apiFetch("/v1/billing/trial", { method: "POST", ...NO_STORE });
      return true;
    } catch {
      return false;
    }
  },

  /** Begin an upgrade. Returns a payment link (razorpay) or invoice info (manual); null if not signed in. */
  async checkout(plan: M.PlanId): Promise<M.CheckoutResult | null> {
    if (!isApiConfigured()) return null;
    try {
      return await apiFetch<M.CheckoutResult>("/v1/billing/checkout", POST(plan));
    } catch {
      return null;
    }
  },

  /** Self-activate (MANUAL provider / sandbox only). Returns false if the gateway is live or on error. */
  async activate(plan: M.PlanId): Promise<boolean> {
    if (!isApiConfigured()) return false;
    try {
      await apiFetch("/v1/billing/activate", POST(plan));
      return true;
    } catch {
      return false;
    }
  },
};
