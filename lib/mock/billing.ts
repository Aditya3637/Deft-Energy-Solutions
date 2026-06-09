/** Billing fixtures — mirror of the server plan catalog (server/src/billing/plans.ts). */

export type PlanId = "FREE" | "PRO" | "ENTERPRISE";
export type Feature =
  | "alerts" | "tasks" | "roi" | "compliance" | "carbon" | "exports"
  | "markets" | "assets" | "managedRecovery" | "sso" | "api" | "whiteLabel";

export const UNLIMITED = -1;

export type Plan = {
  id: PlanId;
  name: string;
  priceInr: number;
  unit: string;
  custom: boolean;
  tagline: string;
  limits: { buildings: number; savedBillsPerMonth: number };
  features: Feature[];
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
    features: ["alerts", "tasks", "roi", "compliance", "carbon", "exports", "markets", "assets", "managedRecovery", "sso", "api", "whiteLabel"],
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

export type BillingStatus = {
  plan: PlanId;
  planName: string;
  status: string;
  priceInr: number;
  unit: string;
  custom: boolean;
  periodEnd: string | null;
  trialing: boolean;
  trialDaysLeft: number | null;
  trialAvailable: boolean;
  usage: { buildings: number; savedBillsThisMonth: number };
  limits: { buildings: number; savedBillsPerMonth: number };
  features: Feature[];
};

export type CheckoutResult = {
  mode: "razorpay" | "manual";
  plan: string;
  amountInr: number;
  redirectUrl?: string;
  reference?: string;
  instructions?: string;
};

/** Demo default (anonymous / off-server): the Free plan. */
export const DEFAULT_STATUS: BillingStatus = {
  plan: "FREE",
  planName: "Free",
  status: "active",
  priceInr: 0,
  unit: "",
  custom: false,
  periodEnd: null,
  trialing: false,
  trialDaysLeft: null,
  trialAvailable: true,
  usage: { buildings: 1, savedBillsThisMonth: 1 },
  limits: { buildings: 1, savedBillsPerMonth: 3 },
  features: [],
};
