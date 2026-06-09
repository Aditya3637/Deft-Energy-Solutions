/**
 * Plan catalog + entitlements — the SINGLE SOURCE OF TRUTH for what each tier
 * costs, allows, and unlocks. The pricing page, the in-app paywall, and the
 * server-side enforcement all read from here, so they can never drift.
 *
 * Pure and deterministic (no I/O): the billing service feeds it the org's plan
 * and live usage; the CI invariant exercises the gates directly. Money rides on
 * this (it decides who pays for what) — same discipline as the diagnosis engine.
 */

export type PlanId = "FREE" | "PRO" | "ENTERPRISE";

/** Capability flags gated by plan. Bill analysis itself is NEVER gated — it's the funnel. */
export type Feature =
  | "alerts"
  | "tasks"
  | "roi"
  | "compliance"
  | "carbon"
  | "exports"
  | "markets"
  | "assets"
  | "managedRecovery"
  | "sso"
  | "api"
  | "whiteLabel";

export const UNLIMITED = -1;

export type Plan = {
  id: PlanId;
  name: string;
  /** ₹ per site / month. 0 for Free; Enterprise is custom (priced on contact). */
  priceInr: number;
  unit: string;
  custom: boolean;
  tagline: string;
  limits: { buildings: number; savedBillsPerMonth: number }; // UNLIMITED (-1) = no cap
  features: Feature[];
  /** Marketing bullets for the pricing page. */
  highlights: string[];
};

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    priceInr: 0,
    unit: "",
    custom: false,
    tagline: "Analyse a bill, no signup",
    limits: { buildings: 1, savedBillsPerMonth: 3 },
    features: [],
    highlights: ["Single-bill analysis", "All 58 loss checks", "Savings estimate", "1 building", "3 saved bills / month"],
  },
  {
    id: "PRO",
    name: "Pro",
    priceInr: 4999,
    unit: "/site/mo",
    custom: false,
    tagline: "Monitor a portfolio, continuously",
    limits: { buildings: 25, savedBillsPerMonth: UNLIMITED },
    features: ["alerts", "tasks", "roi", "compliance", "carbon", "exports"],
    highlights: [
      "Everything in Free",
      "Unlimited bills & history",
      "Continuous monitoring + alerts",
      "Tasks, ROI, compliance & carbon",
      "Savings-realisation tracking",
      "Up to 25 buildings",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceInr: 0,
    unit: "",
    custom: true,
    tagline: "Markets, assets & managed recovery",
    limits: { buildings: UNLIMITED, savedBillsPerMonth: UNLIMITED },
    features: [
      "alerts", "tasks", "roi", "compliance", "carbon", "exports",
      "markets", "assets", "managedRecovery", "sso", "api", "whiteLabel",
    ],
    highlights: [
      "Everything in Pro",
      "Open access & energy markets",
      "BESS / microgrid / VPP",
      "Managed loss recovery",
      "SSO, API & white-label",
      "Unlimited buildings",
    ],
  },
];

const BY_ID: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

/** Resolve a plan, defaulting unknown/blank to FREE. */
export function planById(id: string | null | undefined): Plan {
  return BY_ID[(id ?? "") as PlanId] ?? BY_ID.FREE;
}

/** The next tier up, for upgrade prompts (ENTERPRISE is the ceiling). */
export function nextPlan(id: PlanId): PlanId | null {
  return id === "FREE" ? "PRO" : id === "PRO" ? "ENTERPRISE" : null;
}

export function hasFeature(id: string, feature: Feature): boolean {
  return planById(id).features.includes(feature);
}

function withinLimit(used: number, limit: number): boolean {
  return limit === UNLIMITED || used < limit;
}

export type Gate = { allowed: boolean; limit: number; reason?: string; upgradeTo?: PlanId };

/**
 * The plan an org is ACTUALLY entitled to right now, derived (never stored) from
 * its latest subscription row + the clock — so an expired trial or a lapsed
 * one-time period silently falls back to Free without a cron. A recurring
 * subscription has no endDate and stays active until a cancel webhook flips it.
 */
export function effectivePlanOf(
  sub: { plan: string; status: string; endDate: Date | null } | null,
  now: Date,
): PlanId {
  if (!sub) return "FREE";
  if (sub.status !== "active" && sub.status !== "trialing") return "FREE";
  if (sub.endDate && sub.endDate.getTime() < now.getTime()) return "FREE"; // expired trial / lapsed period
  return planById(sub.plan).id;
}

export const TRIAL_DAYS = 14;

/** Can this org add another building? */
export function canAddBuilding(id: string, currentCount: number): Gate {
  const plan = planById(id);
  const limit = plan.limits.buildings;
  if (withinLimit(currentCount, limit)) return { allowed: true, limit };
  return {
    allowed: false,
    limit,
    reason: `Your ${plan.name} plan includes ${limit} building${limit === 1 ? "" : "s"}.`,
    upgradeTo: nextPlan(plan.id) ?? undefined,
  };
}

/** Can this org save (persist + diagnose) another bill this month? */
export function canSaveBill(id: string, usedThisMonth: number): Gate {
  const plan = planById(id);
  const limit = plan.limits.savedBillsPerMonth;
  if (withinLimit(usedThisMonth, limit)) return { allowed: true, limit };
  return {
    allowed: false,
    limit,
    reason: `Your ${plan.name} plan saves ${limit} bills/month. Upgrade for unlimited history & monitoring.`,
    upgradeTo: nextPlan(plan.id) ?? undefined,
  };
}
