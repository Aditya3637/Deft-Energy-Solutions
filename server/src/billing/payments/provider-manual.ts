import { type CheckoutResult } from "./payments-core";

/**
 * Manual provider — works with no payment account. Returns invoice instructions;
 * in this mode the org can self-activate (sandbox / invoice-paid-offline). When
 * Razorpay is configured, self-activation is refused (webhook-only) so paid
 * plans can never be granted for free in production.
 */
export function manualCheckout(plan: string, amountInr: number): CheckoutResult {
  return {
    mode: "manual",
    plan,
    amountInr,
    instructions:
      amountInr > 0
        ? `We'll raise an invoice for the ${plan} plan (₹${amountInr.toLocaleString("en-IN")}/site/mo). ` +
          `Email billing@deftenergy.example or your account manager to activate.`
        : `Contact sales for ${plan} pricing — billing@deftenergy.example.`,
  };
}
