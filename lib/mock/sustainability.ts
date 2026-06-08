/** Mock sustainability / compliance data for Stage B5 (decision-maker screens). Deterministic. */

export const CARBON = {
  scope1: 1240,
  scope2: 8650,
  scope3: 3110,
  unit: "tCO₂e",
};
export const CARBON_TOTAL = CARBON.scope1 + CARBON.scope2 + CARBON.scope3;

export const ESG = {
  overall: 72,
  environment: 68,
  social: 75,
  governance: 78,
  percentile: "Top 25% of peers",
};

export const NET_ZERO = {
  targetYear: 2040,
  baselineYear: 2022,
  progressPct: 34,
};

export type ComplianceStatus = "compliant" | "at_risk" | "overdue" | "upcoming";

export type Obligation = {
  id: string;
  name: string;
  framework: string;
  status: ComplianceStatus;
  due: string;
  owner: string;
};

export const OBLIGATIONS: Obligation[] = [
  { id: "o1", name: "BRSR annual filing (FY 25-26)", framework: "SEBI", status: "at_risk", due: "30-09-2026", owner: "CFO" },
  { id: "o2", name: "RPO compliance (FY 25-26)", framework: "MNRE / SERC", status: "at_risk", due: "31-03-2027", owner: "Energy Mgr" },
  { id: "o3", name: "ECBC building compliance", framework: "BEE", status: "compliant", due: "—", owner: "Facilities" },
  { id: "o4", name: "ISO 50001 surveillance audit", framework: "ISO", status: "upcoming", due: "15-08-2026", owner: "Energy Mgr" },
  { id: "o5", name: "Power-factor compliance (all sites > 0.90)", framework: "DISCOM", status: "at_risk", due: "ongoing", owner: "Facilities" },
  { id: "o6", name: "Electrical safety audit", framework: "CEA", status: "overdue", due: "20-05-2026", owner: "Facilities" },
  { id: "o7", name: "CGWA annual return", framework: "CGWA", status: "compliant", due: "—", owner: "EHS" },
  { id: "o8", name: "Fire & safety NOC renewal", framework: "State Fire Dept", status: "upcoming", due: "30-07-2026", owner: "Facilities" },
];

export const BRSR_SECTIONS = [
  { name: "Section A — General disclosures", pct: 100, auto: false },
  { name: "Section B — Management & process", pct: 80, auto: false },
  { name: "Principle 6 — Environment (energy, emissions, water)", pct: 72, auto: true },
  { name: "Principle 2 — Sustainable & safe goods", pct: 55, auto: false },
  { name: "Principle 3 — Employee wellbeing", pct: 90, auto: false },
];

export type Risk = { id: string; title: string; severity: "high" | "medium" | "low" };
export const RISKS: Risk[] = [
  { id: "r1", title: "Electrical safety audit overdue at 1 site — regulatory exposure", severity: "high" },
  { id: "r2", title: "BRSR environment section due in <4 months, 28% incomplete", severity: "medium" },
  { id: "r3", title: "RPO shortfall risk — REC purchase not yet placed", severity: "medium" },
];

export type ExecOpportunity = { id: string; title: string; annualINR: number };
export const EXEC_OPPORTUNITIES: ExecOpportunity[] = [
  { id: "e1", title: "Open access across HT sites", annualINR: 4687200 },
  { id: "e2", title: "Power-factor correction (CoolChain + others)", annualINR: 578400 },
  { id: "e3", title: "Time-of-day load shifting", annualINR: 1109376 },
];
