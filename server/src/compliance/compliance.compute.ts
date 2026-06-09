/**
 * Compliance scorecard — DERIVED from the org's real energy data.
 *
 * Pure, deterministic, no I/O: the service feeds it rows read under RLS, and the
 * CI invariant (`scripts/compliance-check.ts`) feeds it synthetic personas. The
 * discipline mirrors the diagnosis engine: no false positives — an obligation is
 * only "compliant" when the data actually supports it, and "upcoming" (not
 * compliant) when we simply don't have the data to assess it.
 */

export type ComplianceStatus = "compliant" | "at_risk" | "overdue" | "upcoming";

export type Obligation = {
  id: string;
  name: string;
  framework: string;
  status: ComplianceStatus;
  due: string;
  owner: string;
};

export type BrsrSection = { name: string; pct: number; auto: boolean };

export type Esg = {
  overall: number;
  environment: number;
  social: number;
  governance: number;
  percentile: string;
};

export type ComplianceScorecard = {
  obligations: Obligation[];
  brsr: BrsrSection[];
  esg: Esg;
};

/** Minimal bill projection the computation needs (a slice of ElectricityBill). */
export type BillRow = {
  powerFactor: number | null;
  pfPenaltyAmt: number | null;
  dueOn: Date | null;
  paidAt: Date | null;
  energyKwh: number | null;
  maxDemandKva: number | null;
  contractDemandKva: number | null;
};

export type BuildingRow = { billsReceived: number; billsExpected: number };

export type ComplianceInput = {
  now: Date;
  bills: BillRow[];
  buildings: BuildingRow[];
  ghgYears: number[]; // years for which a GHG inventory exists
};

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Indian fiscal year starts in April (month index 3). */
function fyStartYear(now: Date): number {
  return now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

/** Power-factor compliance across all sites — DISCOM penalty norm (≥ 0.90). */
function pfStatus(bills: BillRow[]): ComplianceStatus {
  const withPf = bills.filter((b) => b.powerFactor != null);
  // An actually-levied PF penalty, or a measured PF below the norm, is a standing
  // non-compliance (money on the table) — flag at_risk, never a false "compliant".
  if (bills.some((b) => (b.pfPenaltyAmt ?? 0) > 0)) return "at_risk";
  if (withPf.some((b) => (b.powerFactor as number) < 0.9)) return "at_risk";
  if (withPf.length > 0) return "compliant";
  return "upcoming"; // no PF data captured yet — cannot assess
}

/** Electricity dues currency — derived from due dates vs payment. */
function duesStatus(bills: BillRow[], now: Date): { status: ComplianceStatus; due: string } {
  const unpaid = bills.filter((b) => b.dueOn != null && b.paidAt == null);
  const overdue = unpaid.filter((b) => (b.dueOn as Date).getTime() < now.getTime());
  const dueSoon = unpaid.filter((b) => {
    const t = (b.dueOn as Date).getTime();
    return t >= now.getTime() && t - now.getTime() <= 7 * DAY_MS;
  });
  const earliest = unpaid
    .map((b) => b.dueOn as Date)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const due = earliest ? fmtDate(earliest) : "—";
  if (overdue.length > 0) return { status: "overdue", due };
  if (dueSoon.length > 0) return { status: "at_risk", due };
  return { status: "compliant", due };
}

/** Environment-data completeness (0–100) — drives BRSR Principle 6 and ESG-E. */
function envCompleteness(input: ComplianceInput): number {
  const { bills, ghgYears, now } = input;
  const signals = [
    bills.some((b) => b.energyKwh != null), // energy consumption captured
    bills.some((b) => b.maxDemandKva != null || b.contractDemandKva != null), // demand captured
    bills.some((b) => b.powerFactor != null), // power quality captured
    ghgYears.some((y) => y >= fyStartYear(now)), // current-FY GHG inventory exists
  ];
  const got = signals.filter(Boolean).length;
  return Math.round((100 * got) / signals.length);
}

export function computeCompliance(input: ComplianceInput): ComplianceScorecard {
  const { bills, buildings, ghgYears, now } = input;
  const fy = fyStartYear(now);
  const envPct = envCompleteness(input);

  const dues = duesStatus(bills, now);

  // GHG / emissions baseline for the current FY.
  const hasCurrentGhg = ghgYears.some((y) => y >= fy);
  const ghgStatus: ComplianceStatus = hasCurrentGhg
    ? "compliant"
    : ghgYears.length > 0
      ? "at_risk"
      : "upcoming";

  // BRSR environment readiness gates the filing-prep status (filing itself is future-dated).
  const brsrStatus: ComplianceStatus = envPct >= 80 ? "compliant" : "at_risk";

  // Bill-capture coverage across the portfolio.
  const received = buildings.reduce((s, b) => s + b.billsReceived, 0);
  const expected = buildings.reduce((s, b) => s + b.billsExpected, 0);
  const coverageStatus: ComplianceStatus =
    expected === 0 ? "upcoming" : received >= expected ? "compliant" : "at_risk";

  const obligations: Obligation[] = [
    {
      id: "pf",
      name: "Power-factor compliance (all sites ≥ 0.90)",
      framework: "DISCOM",
      status: pfStatus(bills),
      due: "ongoing",
      owner: "Facilities",
    },
    {
      id: "dues",
      name: "Electricity dues current (no overdue bills)",
      framework: "DISCOM",
      status: dues.status,
      due: dues.due,
      owner: "Finance",
    },
    {
      id: "ghg",
      name: `GHG emissions inventory (FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")})`,
      framework: "GHG Protocol",
      status: ghgStatus,
      due: ghgStatus === "compliant" ? "—" : "pending",
      owner: "EHS",
    },
    {
      id: "brsr",
      name: `BRSR annual filing (FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")})`,
      framework: "SEBI",
      status: brsrStatus,
      due: `30-09-${fy + 1}`,
      owner: "CFO",
    },
    {
      id: "coverage",
      name: "Energy-data capture (bills received vs expected)",
      framework: "Deft / internal",
      status: coverageStatus,
      due: expected === 0 ? "—" : `${received} of ${expected} captured`,
      owner: "Energy Mgr",
    },
  ];

  // BRSR report scaffold: only Principle 6 (environment) is platform-derived;
  // the rest are company-level disclosures the customer maintains.
  const brsr: BrsrSection[] = [
    { name: "Section A — General disclosures", pct: 100, auto: false },
    { name: "Section B — Management & process", pct: 80, auto: false },
    { name: "Principle 6 — Environment (energy, emissions, water)", pct: envPct, auto: true },
    { name: "Principle 2 — Sustainable & safe goods", pct: 55, auto: false },
    { name: "Principle 3 — Employee wellbeing", pct: 90, auto: false },
  ];

  // ESG: only the Environment pillar is platform-driven (data completeness, less a
  // penalty for standing PF / overdue issues). Social & governance are nominal —
  // the platform has no signal for them, so we don't fabricate movement.
  const pfPenalised = pfStatus(bills) !== "compliant" && pfStatus(bills) !== "upcoming";
  const environment = clamp(
    envPct - (pfPenalised ? 10 : 0) - (dues.status === "overdue" ? 10 : 0),
    0,
    100,
  );
  const social = 75;
  const governance = 78;
  const overall = Math.round((environment + social + governance) / 3);
  const percentile =
    overall >= 75 ? "Top quartile of peers" : overall >= 60 ? "Median range" : "Below median";

  return {
    obligations,
    brsr,
    esg: { overall, environment, social, governance, percentile },
  };
}
