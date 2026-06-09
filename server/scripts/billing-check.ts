/**
 * Plan & entitlement invariants (CI — `ts-node --transpile-only`).
 *
 * Money rides on these gates (they decide who pays for what), so they're locked
 * like the diagnosis/commission engines: limits enforced exactly, feature flags
 * correct per tier, upgrade targets sane, and the catalog internally consistent.
 * Exits non-zero on any failure.
 */

import {
  PLANS,
  UNLIMITED,
  canAddBuilding,
  canSaveBill,
  effectivePlanOf,
  hasFeature,
  nextPlan,
  planById,
} from "../src/billing/plans";
import {
  providerName as paymentProvider,
  razorpayPlanId,
  verifyRazorpaySignature,
  webhookAction,
} from "../src/billing/payments/payments-core";
import { activationFromWebhook } from "../src/billing/payments/provider-razorpay";
import { createHmac } from "node:crypto";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

console.log("Plan & entitlement invariants:");

// ── Catalog integrity ──────────────────────────────────────────────────────────
{
  const ids = PLANS.map((p) => p.id);
  check(new Set(ids).size === ids.length, "plan ids are unique");
  check(planById("FREE").priceInr === 0, "Free plan is ₹0");
  check(planById("PRO").priceInr > 0, "Pro plan has a price");
  check(planById("ENTERPRISE").custom === true, "Enterprise is custom-priced");
  check(planById("nonsense").id === "FREE", "unknown plan id defaults to FREE");
}

// ── Building limits ──────────────────────────────────────────────────────────────
{
  check(canAddBuilding("FREE", 0).allowed, "FREE may add its 1st building");
  const g = canAddBuilding("FREE", 1);
  check(!g.allowed && g.upgradeTo === "PRO", "FREE blocked at 1 building → upgrade to PRO");
  check(canAddBuilding("PRO", 24).allowed, "PRO may add up to 25 buildings");
  const gp = canAddBuilding("PRO", 25);
  check(!gp.allowed && gp.upgradeTo === "ENTERPRISE", "PRO blocked at 25 → upgrade to ENTERPRISE");
  check(canAddBuilding("ENTERPRISE", 100_000).allowed, "ENTERPRISE buildings unlimited");
}

// ── Saved-bill limits (the free funnel cap) ──────────────────────────────────────
{
  check(canSaveBill("FREE", 2).allowed, "FREE may save its 3rd bill this month");
  const g = canSaveBill("FREE", 3);
  check(!g.allowed && g.upgradeTo === "PRO", "FREE blocked at 3 saved bills → upgrade to PRO");
  check(canSaveBill("PRO", 9999).allowed, "PRO saved bills unlimited");
  check(planById("PRO").limits.savedBillsPerMonth === UNLIMITED, "PRO savedBills limit is UNLIMITED sentinel");
}

// ── Feature gating ───────────────────────────────────────────────────────────────
{
  check(!hasFeature("FREE", "alerts"), "FREE does NOT include alerts");
  check(hasFeature("PRO", "alerts") && hasFeature("PRO", "compliance"), "PRO includes alerts + compliance");
  check(!hasFeature("PRO", "markets"), "PRO does NOT include energy markets");
  check(hasFeature("ENTERPRISE", "markets") && hasFeature("ENTERPRISE", "sso"), "ENTERPRISE includes markets + SSO");
  // Bill analysis is the funnel — never a gated feature on any plan.
  check(PLANS.every((p) => !(p.features as string[]).includes("analysis")), "bill analysis is never a gated feature");
}

// ── Upgrade ladder ───────────────────────────────────────────────────────────────
{
  check(nextPlan("FREE") === "PRO" && nextPlan("PRO") === "ENTERPRISE", "upgrade ladder FREE→PRO→ENTERPRISE");
  check(nextPlan("ENTERPRISE") === null, "ENTERPRISE is the ceiling");
}

// ── Payment provider selection ───────────────────────────────────────────────────
{
  delete process.env.PAYMENTS_PROVIDER;
  check(paymentProvider() === "manual", "payments default to manual (no account needed)");
  process.env.PAYMENTS_PROVIDER = "razorpay";
  check(paymentProvider() === "razorpay", "PAYMENTS_PROVIDER=razorpay selects the gateway");
  delete process.env.PAYMENTS_PROVIDER;
}

// ── Webhook signature (the boundary that grants paid plans) ──────────────────────
{
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity: { notes: { orgId: "org-1", plan: "PRO" } } } } });
  const goodSig = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  check(verifyRazorpaySignature(body, goodSig, secret), "valid webhook signature verifies");
  check(!verifyRazorpaySignature(body, "deadbeef", secret), "tampered signature is rejected");
  check(!verifyRazorpaySignature(body, goodSig, "wrong_secret"), "wrong secret is rejected");
  check(!verifyRazorpaySignature("", goodSig, secret), "empty body is rejected");

  const target = activationFromWebhook(JSON.parse(body));
  check(target?.orgId === "org-1" && target?.plan === "PRO", "activation target extracted from webhook notes");
  check(activationFromWebhook({ event: "x", payload: {} }) === null, "no notes → no activation (no false grant)");

  // subscription events also carry notes
  const subTarget = activationFromWebhook({
    event: "subscription.charged",
    payload: { subscription: { entity: { notes: { orgId: "org-2", plan: "PRO" } } } },
  });
  check(subTarget?.orgId === "org-2", "subscription webhook notes extracted too");
}

// ── Webhook event → action mapping ───────────────────────────────────────────────
{
  check(webhookAction("payment_link.paid") === "activate_onetime", "payment_link.paid → activate one-time");
  check(webhookAction("subscription.charged") === "activate_recurring", "subscription.charged → activate recurring");
  check(webhookAction("subscription.activated") === "activate_recurring", "subscription.activated → activate recurring");
  check(webhookAction("subscription.cancelled") === "downgrade", "subscription.cancelled → downgrade");
  check(webhookAction("subscription.halted") === "downgrade", "subscription.halted (retries exhausted) → downgrade");
  check(webhookAction("subscription.pending") === "mark_past_due", "subscription.pending (charge failed) → dunning grace");
  check(webhookAction("payment.authorized") === "ignore", "unrelated event → ignore");
}

// ── Trial & recurring: effective-plan resolution (derived, no cron) ──────────────
{
  const now = new Date("2026-06-09T00:00:00Z");
  const future = new Date("2026-06-20T00:00:00Z");
  const past = new Date("2026-06-01T00:00:00Z");
  check(effectivePlanOf(null, now) === "FREE", "no subscription → FREE");
  check(effectivePlanOf({ plan: "PRO", status: "trialing", endDate: future }, now) === "PRO", "active trial → PRO");
  check(effectivePlanOf({ plan: "PRO", status: "trialing", endDate: past }, now) === "FREE", "expired trial → FREE (no cron)");
  check(effectivePlanOf({ plan: "PRO", status: "active", endDate: null }, now) === "PRO", "recurring (no endDate) → PRO");
  check(effectivePlanOf({ plan: "PRO", status: "active", endDate: past }, now) === "FREE", "lapsed one-time period → FREE");
  check(effectivePlanOf({ plan: "PRO", status: "cancelled", endDate: future }, now) === "FREE", "cancelled → FREE even if dated future");
  check(effectivePlanOf({ plan: "ENTERPRISE", status: "active", endDate: null }, now) === "ENTERPRISE", "recurring Enterprise → ENTERPRISE");
  // Dunning: a failed charge keeps Pro during the grace window, then drops.
  check(effectivePlanOf({ plan: "PRO", status: "past_due", endDate: future }, now) === "PRO", "past_due within grace → still PRO");
  check(effectivePlanOf({ plan: "PRO", status: "past_due", endDate: past }, now) === "FREE", "past_due after grace → FREE (no cron)");
}

// ── Recurring plan-id detection ──────────────────────────────────────────────────
{
  delete process.env.RAZORPAY_PLAN_ID_PRO;
  check(razorpayPlanId("PRO") === "", "no Razorpay plan id → one-time fallback");
  process.env.RAZORPAY_PLAN_ID_PRO = "plan_test123";
  check(razorpayPlanId("PRO") === "plan_test123", "configured Razorpay plan id → recurring");
  delete process.env.RAZORPAY_PLAN_ID_PRO;
}

if (failures > 0) {
  console.error(`\n${failures} billing invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll plan & entitlement invariants hold.");
