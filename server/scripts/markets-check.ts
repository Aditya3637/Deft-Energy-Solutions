/**
 * Energy-markets & DER invariants (CI — `ts-node --transpile-only`).
 *
 * Customer-angle test: org personas across multiple DISCOMs (MSEDCL / BESCOM /
 * TANGEDCO / TPDDL). The B6 numbers are DERIVED from real bills + equipment, so
 * the discipline matches diagnosis/compliance — NO FABRICATION: an empty org
 * yields zeros (never invented sizing/savings), Scope-2 follows kWh exactly, and
 * open-access eligibility follows the ≥1 MW rule. Exits non-zero on any failure.
 */

import {
  bess,
  carbonCredits,
  ghgScopes,
  microgrid,
  openAccess,
  vpp,
  type BillRow,
  type MarketsInput,
} from "../src/markets/markets.compute";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

const GRID_FACTOR = 0.00071;

/** A complete HT bill row; override per persona. */
function bill(over: Partial<BillRow> = {}): BillRow {
  return {
    discom: "MSEDCL",
    energyKwh: 400_000,
    maxDemandKva: 1200,
    contractDemandKva: 1500,
    sanctionedLoadKw: 1500,
    supplyVoltage: "HT-11kV",
    totalAmountDue: 3_200_000, // ₹8/kWh blended
    fixedDemandCharges: 600_000, // ₹400/kVA × 1500
    crossSubsidySurcharge: 480_000, // ₹1.20/kWh
    additionalSurcharge: 120_000, // ₹0.30/kWh
    wheelingCharges: 240_000, // ₹0.60/kWh
    todPeakRate: 9,
    todOffPeakRate: 3,
    ...over,
  };
}

const empty: MarketsInput = { bills: [], buildings: [], equipment: [], ghg: [] };

console.log("Energy-markets & DER invariants (multi-DISCOM personas):");

// ── Persona 1: "Maharashtra Mills" (MSEDCL) — HT, OA-eligible, full data ───────
{
  const input: MarketsInput = {
    bills: [bill()],
    buildings: [{ discom: "MSEDCL", sanctionedLoadKw: 1500, contractDemandKva: 1500, savingsInr: 800_000 }],
    equipment: [],
    ghg: [],
  };
  const scopes = ghgScopes(input);
  const s2 = scopes.find((s) => s.scope === "Scope 2")!;
  check(s2.tco2e === Math.round(400_000 * GRID_FACTOR), "P1 Scope 2 = kWh × grid factor");
  check(s2.sources.some((src) => src.name === "Grid — MSEDCL"), "P1 Scope 2 attributed to MSEDCL grid");
  check(scopes[0].tco2e === 0 && scopes[2].tco2e === 0, "P1 no inventory → Scope 1 & 3 are 0 (not invented)");

  const oa = openAccess(input);
  check(oa.eligible === true, "P1 1500 kW load → open-access eligible");
  check(oa.gridRateINR === 8, "P1 blended grid rate = ₹8/kWh from bill totals");
  check(oa.charges.find((c) => c.name === "Cross-subsidy surcharge")!.rate === 1.2, "P1 CSS ₹1.20/kWh from bill");
  check(oa.charges.find((c) => c.name === "Wheeling charge")!.rate === 0.6, "P1 wheeling ₹0.60/kWh from bill");

  const b = bess(input);
  check(b.peakKw === 1200, "P1 BESS peak = metered max demand");
  check(b.recommendedKw === 360, "P1 BESS sized at 30% of peak");
  check(b.recommendedKwh === 720, "P1 BESS 2-hour duration");
  check(b.demandSavingINR === 360 * 400 * 12, "P1 demand saving = kW × ₹/kVA-mo × 12");
  check(b.paybackYrs > 0 && Number.isFinite(b.paybackYrs), "P1 payback positive & finite");

  const cc = carbonCredits(input);
  check(cc.source === "estimated" && cc.retired === 0, "P1 credits are estimated potential, retired = 0");
  check(cc.held > 0, "P1 savings → positive credit potential");
}

// ── Persona 2: "Bengaluru Office" (BESCOM) — sub-MW, NOT OA-eligible ───────────
{
  const input: MarketsInput = {
    bills: [bill({ discom: "BESCOM", sanctionedLoadKw: 800, maxDemandKva: 600, contractDemandKva: 800 })],
    buildings: [{ discom: "BESCOM", sanctionedLoadKw: 800, contractDemandKva: 800, savingsInr: 0 }],
    equipment: [],
    ghg: [],
  };
  const oa = openAccess(input);
  check(oa.eligible === false, "P2 800 kW load → NOT open-access eligible (no false eligibility)");
  check(carbonCredits(input).held === 0, "P2 no savings → 0 credit potential (not fabricated)");
}

// ── Persona 3: "Chennai Plant" (TANGEDCO) — DER registry present ───────────────
{
  const input: MarketsInput = {
    bills: [bill({ discom: "TANGEDCO" })],
    buildings: [{ discom: "TANGEDCO", sanctionedLoadKw: 1500, contractDemandKva: 1500, savingsInr: 0 }],
    equipment: [
      { type: "Rooftop solar PV", ratingKw: 300 },
      { type: "DG set diesel", ratingKw: 500 },
      { type: "HVAC chiller", ratingKw: 400 },
    ],
    ghg: [],
  };
  const mg = microgrid(input);
  check(mg.components.some((c) => c.name === "Rooftop solar"), "P3 microgrid lists solar from equipment");
  check(mg.components.some((c) => c.name === "DG backup"), "P3 microgrid lists DG from equipment");
  check(mg.renewableSharePct > 0 && mg.renewableSharePct <= 100, "P3 renewable share in 0–100");

  const v = vpp(input);
  check(v.der.some((d) => d.name === "Solar" && d.kw === 300), "P3 VPP aggregates solar kW");
  check(v.der.some((d) => d.name.startsWith("Flexible")), "P3 VPP aggregates flexible loads");
  check(v.drEventsYTD === 0 && v.drRevenueINR === 0, "P3 no DR programme → 0 events/revenue (honest)");
  check(v.sites === 1, "P3 VPP sites = building count");
}

// ── Persona 4: "Delhi HQ" (TPDDL) — recorded GHG inventory ─────────────────────
{
  const input: MarketsInput = {
    bills: [bill({ discom: "TPDDL" })],
    buildings: [{ discom: "TPDDL", sanctionedLoadKw: 1500, contractDemandKva: 1500, savingsInr: 0 }],
    equipment: [],
    ghg: [
      { year: 2024, scope1: 100, scope2: 0, scope3: 100 },
      { year: 2026, scope1: 1240, scope2: 0, scope3: 3110 },
    ],
  };
  const scopes = ghgScopes(input);
  check(scopes[0].tco2e === 1240, "P4 Scope 1 from latest recorded inventory (2026)");
  check(scopes[2].tco2e === 3110, "P4 Scope 3 from latest recorded inventory (2026)");
}

// ── Persona 5: brand-new org, no data — everything zero, nothing fabricated ────
{
  const scopes = ghgScopes(empty);
  check(scopes.every((s) => s.tco2e === 0), "P5 empty org → all scopes 0");
  const b = bess(empty);
  check(b.peakKw === 0 && b.capexINR === 0 && b.paybackYrs === 0, "P5 empty org → no BESS sizing");
  const mg = microgrid(empty);
  check(mg.components.length === 0 && mg.reliabilityPct === 0, "P5 empty org → no microgrid");
  const v = vpp(empty);
  check(v.dispatchableKw === 0 && v.der.length === 0, "P5 empty org → no dispatchable DER");
}

// ── Cross-persona bounds: finite, non-negative, no NaN ─────────────────────────
{
  const samples: MarketsInput[] = [
    empty,
    { bills: [bill()], buildings: [{ discom: "MSEDCL", sanctionedLoadKw: 1500, contractDemandKva: 1500, savingsInr: 800_000 }], equipment: [{ type: "solar", ratingKw: 100 }], ghg: [{ year: 2026, scope1: 1, scope2: 2, scope3: 3 }] },
  ];
  let ok = true;
  for (const inp of samples) {
    const nums = [
      ...ghgScopes(inp).map((s) => s.tco2e),
      bess(inp).capexINR,
      bess(inp).paybackYrs,
      bess(inp).demandSavingINR,
      bess(inp).arbitrageSavingINR,
      microgrid(inp).renewableSharePct,
      microgrid(inp).islandingHours,
      vpp(inp).dispatchableKw,
      carbonCredits(inp).held,
      openAccess(inp).gridRateINR,
    ];
    for (const n of nums) if (!Number.isFinite(n) || n < 0) ok = false;
  }
  check(ok, "all derived numbers finite and non-negative");
}

if (failures > 0) {
  console.error(`\n${failures} markets invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll energy-markets & DER invariants hold.");
