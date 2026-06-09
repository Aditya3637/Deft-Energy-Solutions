/**
 * Payment provider seam — shared types + pure signature verification.
 *
 * Same pattern as the OCR / BBPS / IEX adapters: a built-in MANUAL provider
 * works today (request-an-invoice / sandbox self-activate), and Razorpay
 * activates the moment its keys are set. Env:
 *   PAYMENTS_PROVIDER=razorpay              (default: manual)
 *   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 *
 * `verifyRazorpaySignature` is pure and CI-tested — it's the security boundary
 * that decides whether a webhook may grant a paid plan.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutResult = {
  /** "razorpay" → redirect the user to `redirectUrl`; "manual" → show `instructions`. */
  mode: "razorpay" | "manual";
  plan: string;
  amountInr: number;
  redirectUrl?: string;
  reference?: string;
  instructions?: string;
};

export class PaymentError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export function providerName(): "razorpay" | "manual" {
  return process.env.PAYMENTS_PROVIDER?.trim().toLowerCase() === "razorpay" ? "razorpay" : "manual";
}

export function razorpayConfigured(): boolean {
  return !!process.env.RAZORPAY_KEY_ID?.trim() && !!process.env.RAZORPAY_KEY_SECRET?.trim();
}

/**
 * Verify a Razorpay webhook signature: HMAC-SHA256(rawBody, webhookSecret) in
 * hex, compared in constant time. Returns false on any mismatch or bad input.
 */
export function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
