import { type CheckoutResult, PaymentError, razorpayConfigured } from "./payments-core";

const RZP_BASE = "https://api.razorpay.com/v1";
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

function rzpAuth(): string {
  const keyId = process.env.RAZORPAY_KEY_ID!.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

async function rzpPost(path: string, body: unknown): Promise<Record<string, unknown>> {
  let json: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${RZP_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${rzpAuth()}` },
      body: JSON.stringify(body),
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
  return json;
}

/**
 * One-time Payment Link for a plan's monthly amount (used when no recurring plan
 * id is configured). The org + plan ride in `notes` so the webhook can activate.
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
  const json = await rzpPost("/payment_links", {
    amount: Math.round(amountInr * 100), // paise
    currency: "INR",
    description: `Deft Energy — ${plan} plan`,
    notes: { orgId, plan },
    callback_url: `${appUrl || ""}/app/settings`,
    callback_method: "get",
  });
  const shortUrl = json.short_url;
  if (typeof shortUrl !== "string") throw new PaymentError("Razorpay did not return a payment link");
  return { mode: "razorpay", plan, amountInr, recurring: false, redirectUrl: shortUrl, reference: String(json.id ?? "") };
}

/**
 * Auto-renewing Razorpay Subscription against a pre-created plan id
 * (RAZORPAY_PLAN_ID_<PLAN>); returns its authorisation short URL. org + plan
 * ride in `notes` so the activation/charge webhook can map it back.
 */
export async function createSubscription(
  orgId: string,
  plan: string,
  razorpayPlanId: string,
): Promise<CheckoutResult> {
  if (!razorpayConfigured()) {
    throw new PaymentError("Razorpay not configured (set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET).", 503);
  }
  const json = await rzpPost("/subscriptions", {
    plan_id: razorpayPlanId,
    total_count: 120, // up to 10 years of monthly cycles; a cancel ends it sooner
    customer_notify: 1,
    notes: { orgId, plan },
  });
  const shortUrl = json.short_url;
  if (typeof shortUrl !== "string") throw new PaymentError("Razorpay did not return a subscription link");
  return { mode: "razorpay", plan, amountInr: 0, recurring: true, redirectUrl: shortUrl, reference: String(json.id ?? "") };
}

/** Pull {orgId, plan} from a verified payment / subscription event's notes. */
export function activationFromWebhook(event: Record<string, unknown>): { orgId: string; plan: string } | null {
  const payload = event.payload as Record<string, unknown> | undefined;
  const entities = [
    (payload?.payment_link as Record<string, unknown> | undefined)?.entity,
    (payload?.payment as Record<string, unknown> | undefined)?.entity,
    (payload?.subscription as Record<string, unknown> | undefined)?.entity,
  ];
  for (const e of entities) {
    const notes = (e as Record<string, unknown> | undefined)?.notes as Record<string, unknown> | undefined;
    if (notes && typeof notes.orgId === "string" && typeof notes.plan === "string") {
      return { orgId: notes.orgId, plan: notes.plan };
    }
  }
  return null;
}
