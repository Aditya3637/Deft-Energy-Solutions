/**
 * Compliance scorecard invariants (runs in CI — `ts-node --transpile-only`).
 *
 * Customer-angle test: five org personas with bills across multiple DISCOMs
 * (MSEDCL / BESCOM / TANGEDCO / TPDDL / UPPCL). Compliance is DERIVED from real
 * data, so the discipline matches the diagnosis engine — NO FALSE POSITIVES: an
 * obligation is "compliant" only when the data supports it, and "upcoming" (not
 * compliant) when the data simply isn't there to assess. Exits non-zero on any
 * failure.
 */

import {
  computeCompliance,
  type BillRow,
  type ComplianceInput,
  type ComplianceStatus,
} from "../src/compliance/compliance.compute";

const NOW = new Date("2026-06-09T00:00:00Z"); // FY 2026-27 (Apr 2026–Mar 2027)
const FY = "2026-27";
const STATUSES: ComplianceStatus[] = ["compliant", "at_risk", "overdue", "upcoming"];

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

/** A fully-captured, well-run bill: PF ok, paid, full data. */
function goodBill(over: Partial<BillRow> = {}): BillRow {
  return {
    powerFactor: 0.98,
    pfPenaltyAmt: 0,
    dueOn: new Date("2026-07-01T00:00:00Z"),
    paidAt: new Date("2026-06-05T00:00:00Z"),
    energyKwh: 42000,
    maxDemandKva: 480,
    contractDemandKva: 500,
    ...over,
  };
}

const obl = (s: ReturnType<typeof computeCompliance>, id: string) =>
  s.obligations.find((o) => o.id === id)!;

console.log("Compliance scorecard invariants (multi-DISCOM personas):");

// ── Persona 1: "Sunrise Foods" (MSEDCL + BESCOM) — clean, fully compliant ──────
{
  const input: ComplianceInput = {
    now: NOW,
    bills: [goodBill(), goodBill({ powerFactor: 0.95 })], // MSEDCL, BESCOM
    buildings: [{ billsReceived: 12, billsExpected: 12 }],
    ghgYears: [2026],
  };
  const s = computeCompliance(input);
  check(obl(s, "pf").status === "compliant", "P1 clean org → PF compliant");
  check(obl(s, "dues").status === "compliant", "P1 all paid → dues compliant");
  check(obl(s, "ghg").status === "compliant", "P1 current-FY GHG present → compliant");
  check(obl(s, "brsr").status === "compliant", "P1 full env data → BRSR filing ready");
  check(obl(s, "coverage").status === "compliant", "P1 all bills captured → coverage compliant");
  check(obl(s, "ghg").name.includes(FY), "P1 GHG obligation names the current FY");
  check(s.esg.environment === 100, "P1 ESG environment = 100 (full data, no penalties)");
}

// ── Persona 2: "Pune Castings" (MSEDCL) — PF penalty levied ────────────────────
{
  const input: ComplianceInput = {
    now: NOW,
    bills: [goodBill({ powerFactor: 0.86, pfPenaltyAmt: 18400 })],
    buildings: [{ billsReceived: 6, billsExpected: 6 }],
    ghgYears: [2026],
  };
  const s = computeCompliance(input);
  // NO false positive: a levied PF penalty must NOT read as compliant.
  check(obl(s, "pf").status === "at_risk", "P2 PF penalty levied → at_risk (not compliant)");
  check(s.esg.environment < 100, "P2 PF penalty drags ESG environment below 100");
}

// ── Persona 3: "Chennai Textiles" (TANGEDCO) — bill overdue, unpaid ────────────
{
  const input: ComplianceInput = {
    now: NOW,
    bills: [goodBill({ dueOn: new Date("2026-05-20T00:00:00Z"), paidAt: null })],
    buildings: [{ billsReceived: 3, billsExpected: 6 }],
    ghgYears: [],
  };
  const s = computeCompliance(input);
  check(obl(s, "dues").status === "overdue", "P3 unpaid past-due bill → dues overdue");
  check(obl(s, "dues").due === "20-05-2026", "P3 dues due-date shows earliest unpaid bill");
  check(obl(s, "coverage").status === "at_risk", "P3 3 of 6 bills → coverage at_risk");
  check(obl(s, "ghg").status === "upcoming", "P3 no GHG ever → upcoming (not falsely at_risk-as-compliant)");
}

// ── Persona 4: "Delhi Offices" (TPDDL) — brand-new org, no data yet ────────────
{
  const input: ComplianceInput = { now: NOW, bills: [], buildings: [], ghgYears: [] };
  const s = computeCompliance(input);
  check(obl(s, "pf").status === "upcoming", "P4 no PF data → upcoming (never a false compliant)");
  check(obl(s, "coverage").status === "upcoming", "P4 no buildings → coverage upcoming");
  check(obl(s, "brsr").status === "at_risk", "P4 zero env data → BRSR not ready");
  check(s.esg.environment === 0, "P4 no data → ESG environment 0 (not NaN)");
  const env = s.brsr.find((b) => b.auto)!;
  check(env.pct === 0, "P4 BRSR Principle-6 = 0% with no data");
}

// ── Persona 5: "Lucknow Mall" (UPPCL) — energy captured, but no PF / no GHG ─────
{
  const input: ComplianceInput = {
    now: NOW,
    bills: [goodBill({ powerFactor: null, maxDemandKva: null, contractDemandKva: null })],
    buildings: [{ billsReceived: 12, billsExpected: 12 }],
    ghgYears: [],
  };
  const s = computeCompliance(input);
  const env = s.brsr.find((b) => b.auto)!;
  check(env.pct === 25, "P5 only energy captured → Principle-6 = 25%");
  check(obl(s, "pf").status === "upcoming", "P5 no PF reading → PF upcoming");
  check(obl(s, "brsr").status === "at_risk", "P5 partial env data → BRSR not ready");
}

// ── Cross-persona bounds: everything finite, integral and in range ─────────────
{
  const samples: ComplianceInput[] = [
    { now: NOW, bills: [goodBill()], buildings: [{ billsReceived: 1, billsExpected: 1 }], ghgYears: [2026] },
    { now: NOW, bills: [], buildings: [], ghgYears: [] },
    { now: NOW, bills: [goodBill({ powerFactor: 0.7, pfPenaltyAmt: 5000, dueOn: new Date("2026-01-01T00:00:00Z"), paidAt: null })], buildings: [{ billsReceived: 0, billsExpected: 4 }], ghgYears: [2020] },
  ];
  let bounded = true;
  for (const inp of samples) {
    const s = computeCompliance(inp);
    const e = s.esg;
    for (const v of [e.overall, e.environment, e.social, e.governance]) {
      if (!Number.isFinite(v) || !Number.isInteger(v) || v < 0 || v > 100) bounded = false;
    }
    for (const b of s.brsr) {
      if (!Number.isFinite(b.pct) || b.pct < 0 || b.pct > 100) bounded = false;
    }
    for (const o of s.obligations) {
      if (!STATUSES.includes(o.status)) bounded = false;
    }
  }
  check(bounded, "ESG/BRSR values finite, integral, within 0–100; statuses valid");
}

if (failures > 0) {
  console.error(`\n${failures} compliance invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll compliance invariants hold.");
