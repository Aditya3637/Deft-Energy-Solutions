/**
 * Payment provider dispatch. Manual is the default (no account needed); Razorpay
 * is used when PAYMENTS_PROVIDER=razorpay and its keys are set.
 */

import { type CheckoutResult, providerName, razorpayConfigured } from "./payments-core";
import { createCheckout as razorpayCheckout } from "./provider-razorpay";
import { manualCheckout } from "./provider-manual";

export { providerName, razorpayConfigured } from "./payments-core";
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
  if (isLive()) return razorpayCheckout(orgId, plan, amountInr, appUrl);
  return manualCheckout(plan, amountInr);
}

export type { CheckoutResult };
