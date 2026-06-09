/**
 * Payment provider dispatch. Manual is the default (no account needed); Razorpay
 * is used when PAYMENTS_PROVIDER=razorpay and its keys are set. When a recurring
 * plan id (RAZORPAY_PLAN_ID_<PLAN>) is configured, checkout creates an
 * auto-renewing Subscription; otherwise it falls back to a one-time Payment Link.
 */

import { type CheckoutResult, providerName, razorpayConfigured, razorpayPlanId } from "./payments-core";
import { createCheckout, createSubscription } from "./provider-razorpay";
import { manualCheckout } from "./provider-manual";

export { providerName, razorpayConfigured, webhookAction, razorpayPlanId } from "./payments-core";
export { activationFromWebhook } from "./provider-razorpay";
export { verifyRazorpaySignature } from "./payments-core";

export function isLive(): boolean {
  return providerName() === "razorpay" && razorpayConfigured();
}

export async function startCheckout(
  orgId: string,
  plan: string,
  amountInr: number,
  appUrl: string,
): Promise<CheckoutResult> {
  if (!isLive()) return manualCheckout(plan, amountInr);
  const rpPlan = razorpayPlanId(plan);
  // Recurring when a Razorpay plan id is configured; else a one-time link.
  return rpPlan ? createSubscription(orgId, plan, rpPlan) : createCheckout(orgId, plan, amountInr, appUrl);
}

export type { CheckoutResult };
