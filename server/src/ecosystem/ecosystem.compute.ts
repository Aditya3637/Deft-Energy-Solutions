/**
 * Ecosystem domain (Stage B7) — the org-specific parts DERIVED from real data.
 *
 * Pure, deterministic, no I/O. Badges are earned from the org's actual bills,
 * trends, savings and tasks; reward points scale with real activity; RFQs are
 * the org's real capital requests (`CapexRequest`). Same discipline as the rest:
 * a badge is "earned" only when the data proves it, points come from a
 * transparent formula over real counts, and unbuilt transactional surfaces
 * (vendor bidding) return honest empty states rather than invented bids.
 */

const GRID_FACTOR_TCO2E_PER_KWH = 0.00071;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* --------------------------------------------------------------------- types */

export type BadgeBill = {
  powerFactor: number | null;
  paidAt: Date | null;
  dueOn: Date | null;
  energyKwh: number | null;
  totalAmountDue: number | null;
};
export type BadgeBuilding = { trendL: number[]; savingsInr: number };
export type CapexRow = {
  id: string;
  project: string;
  building: string;
  amountInr: number;
  paybackYrs: number;
  stage: string; // CapexStage
  createdAt: Date;
};

export type EcosystemInput = {
  bills: BadgeBill[];
  buildings: BadgeBuilding[];
  tasksDone: number;
  capex: CapexRow[];
};

export type Badge = { id: string; name: string; desc: string; earned: boolean };
export type Rewards = { points: number; tier: string; redeemable: { id: string; name: string; cost: number }[] };
export type Rfq = {
  id: string;
  title: string;
  category: string;
  bids: number;
  closes: string;
  status: "open" | "evaluating" | "awarded";
};
export type Bid = { vendor: string; amountINR: number; tcoINR: number; deliveryWeeks: number };
export type ReverseAuction = { title: string; closesIn: string; bids: Bid[] };
export type Course = {
  id: string;
  title: string;
  category: string;
  hours: number;
  level: string;
  progressPct: number;
};

/* ---------------------------------------------------------------- helpers */

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

/** Portfolio energy-spend reduction from the aggregated 12-month ₹ trend. */
function reductionPct(buildings: BadgeBuilding[]): number {
  const len = Math.max(0, ...buildings.map((b) => b.trendL.length));
  if (len < 4) return 0;
  const agg = Array.from({ length: len }, (_, i) => sum(buildings.map((b) => b.trendL[i] ?? 0)));
  const q = Math.floor(len / 4) || 1;
  const first = sum(agg.slice(0, q)) / q;
  const last = sum(agg.slice(len - q)) / q;
  if (first <= 0) return 0;
  return Math.round(((first - last) / first) * 100);
}

/** Avoided-emissions estimate (tCO₂e): savings-fraction of Scope-2. */
function avoidedTco2e(input: EcosystemInput): number {
  const scope2 = sum(input.bills.map((b) => b.energyKwh ?? 0)) * GRID_FACTOR_TCO2E_PER_KWH;
  const totalInr = sum(input.bills.map((b) => b.totalAmountDue ?? 0));
  const savings = sum(input.buildings.map((b) => b.savingsInr));
  const ratio = totalInr > 0 ? clamp(savings / totalInr, 0, 0.3) : 0;
  return Math.round(scope2 * ratio);
}

function billsPaidOnTime(bills: BadgeBill[]): number {
  return bills.filter((b) => b.paidAt != null && b.dueOn != null && (b.paidAt as Date) <= (b.dueOn as Date)).length;
}

/* -------------------------------------------------------------- derivations */

export function badges(input: EcosystemInput): Badge[] {
  const withPf = input.bills.filter((b) => b.powerFactor != null);
  const pfPerfect = withPf.length > 0 && withPf.every((b) => (b.powerFactor as number) > 0.95);
  const green = reductionPct(input.buildings) >= 10;
  const carbon = avoidedTco2e(input) >= 1000;
  const billHawk = billsPaidOnTime(input.bills) >= 12;

  return [
    { id: "b1", name: "PF Perfect", desc: "All sites above 0.95 power factor", earned: pfPerfect },
    { id: "b2", name: "Green Champion", desc: "10% portfolio energy reduction", earned: green },
    { id: "b3", name: "Carbon Warrior", desc: "1,000 tCO₂e avoided", earned: carbon },
    { id: "b4", name: "Bill Hawk", desc: "12 bills paid on time", earned: billHawk },
    // No on-site audit module data yet — honestly not earnable until audits land.
    { id: "b5", name: "Audit Ace", desc: "Complete an on-site audit", earned: false },
  ];
}

export function rewards(input: EcosystemInput, redeemable: Rewards["redeemable"]): Rewards {
  const earned = badges(input).filter((b) => b.earned).length;
  const onTime = billsPaidOnTime(input.bills);
  const savings = sum(input.buildings.map((b) => b.savingsInr));
  // Transparent ledger over real activity.
  const points =
    onTime * 50 +
    input.tasksDone * 200 +
    earned * 500 +
    Math.floor(savings / 100_000) * 100;
  const tier = points >= 10_000 ? "Platinum" : points >= 5_000 ? "Gold" : points >= 2_000 ? "Silver" : "Bronze";
  return { points, tier, redeemable };
}

const CATEGORY_RULES: { re: RegExp; category: string }[] = [
  { re: /pf|power factor|apfc|capacitor/i, category: "Power factor" },
  { re: /solar|pv|rooftop/i, category: "Solar" },
  { re: /bess|battery|storage/i, category: "BESS" },
  { re: /led|light/i, category: "Lighting" },
  { re: /hvac|chiller|ac\b|cooling/i, category: "HVAC / controls" },
  { re: /motor|vfd|drive|pump/i, category: "Motors / VFD" },
];

function categoryOf(project: string): string {
  return CATEGORY_RULES.find((r) => r.re.test(project))?.category ?? "General";
}

function rfqStatus(stage: string): Rfq["status"] {
  if (stage === "APPROVED" || stage === "REJECTED") return "awarded";
  if (stage === "CFO" || stage === "BOARD") return "evaluating";
  return "open"; // FM / EM
}

/** The org's real capital requests, presented as procurement RFQs. */
export function rfqs(capex: CapexRow[]): Rfq[] {
  return capex
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((c) => {
      const closes = new Date(c.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      return {
        id: c.id,
        title: `${c.project} — ${c.building}`,
        category: categoryOf(c.project),
        bids: 0, // vendor bidding not yet built — honest zero
        closes: fmtDate(closes),
        status: rfqStatus(c.stage),
      };
    });
}

/** Reverse auction for the top open RFQ. Bids stay empty until bidding ships. */
export function reverseAuction(capex: CapexRow[]): ReverseAuction {
  const open = rfqs(capex).find((r) => r.status === "open");
  return {
    title: open ? open.title : "No active reverse auction",
    closesIn: "—",
    bids: [], // honest empty state — no vendor-bidding system yet
  };
}

/** Catalog courses with per-org progress (0 until a progress store exists). */
export function courses(
  catalog: { id: string; title: string; category: string; hours: number; level: string }[],
  progress: Record<string, number> = {},
): Course[] {
  return catalog.map((c) => ({ ...c, progressPct: clamp(progress[c.id] ?? 0, 0, 100) }));
}
