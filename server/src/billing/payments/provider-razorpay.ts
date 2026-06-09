import { type CheckoutResult, PaymentError, razorpayConfigured } from "./payments-core";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * Create a Razorpay Payment Link for a plan's monthly amount and return its
 * hosted short URL to redirect the user to. (Recurring Subscriptions API is a
 * follow-up; a link-per-period keeps the integration real and testable now.)
 * The org + plan are stamped in `notes` so the webhook can activate on payment.
 */
export async function createCheckout(
  orgId: string,
  plan: string,
  amountInr: number,
  appUrl: string,
): Promise<CheckoutResult> {
  if (!razorpayConfigured()) {
    throw new PaymentError("Razorpay not configured (set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET).", 503);
  }
  const keyId = process.env.RAZORPAY_KEY_ID!.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const body = JSON.stringify({
    amount: Math.round(amountInr * 100), // paise
    currency: "INR",
    description: `Deft Energy — ${plan} plan`,
    notes: { orgId, plan },
    callback_url: `${appUrl || ""}/app/settings`,
    callback_method: "get",
  });

  let json: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body,
    });
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      if (RETRYABLE.has(res.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      const err = (j?.error as Record<string, unknown> | undefined)?.description;
      throw new PaymentError(`Razorpay error: ${typeof err === "string" ? err : `${res.status}`}`, res.status);
    }
    json = j ?? {};
    break;
  }
  if (!json) throw new PaymentError("Empty response from Razorpay");

  const shortUrl = json.short_url;
  if (typeof shortUrl !== "string") throw new PaymentError("Razorpay did not return a payment link");
  return { mode: "razorpay", plan, amountInr, redirectUrl: shortUrl, reference: String(json.id ?? "") };
}

/** Pull {orgId, plan} from a verified payment_link.paid (or payment.captured) event. */
export function activationFromWebhook(event: Record<string, unknown>): { orgId: string; plan: string } | null {
  const payload = event.payload as Record<string, unknown> | undefined;
  const entities = [
    (payload?.payment_link as Record<string, unknown> | undefined)?.entity,
    (payload?.payment as Record<string, unknown> | undefined)?.entity,
  ];
  for (const e of entities) {
    const notes = (e as Record<string, unknown> | undefined)?.notes as Record<string, unknown> | undefined;
    if (notes && typeof notes.orgId === "string" && typeof notes.plan === "string") {
      return { orgId: notes.orgId, plan: notes.plan };
    }
  }
  return null;
}
