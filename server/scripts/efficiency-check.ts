/**
 * Efficiency engine invariants (CI — `ts-node --transpile-only`).
 *
 * Customer-angle test: industrial vs commercial vs mixed-portfolio personas.
 * Savings are DERIVED from real kWh × the org's blended rate, so the discipline
 * matches diagnosis: scales with consumption, is capped at a realistic ceiling,
 * picks the right ECMs per building kind, and a no-data org yields zero (never a
 * fabricated retrofit). Exits non-zero on any failure.
 */

import {
  computeEfficiency,
  type BillRow,
  type BuildingRow,
  type EfficiencyInput,
} from "../src/efficiency/efficiency.compute";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

// ₹8/kWh blended (totalAmountDue = 8 × energyKwh).
const bill = (kwh: number, buildingId: string | null): BillRow => ({ energyKwh: kwh, totalAmountDue: kwh * 8, buildingId });
const has = (id: string, m: ReturnType<typeof computeEfficiency>) => m.measures.some((x) => x.id === id);

console.log("Efficiency engine invariants (industrial / commercial / mixed):");

// ── Persona 1: "Pune Castings" — INDUSTRIAL, 1.2M kWh/yr ───────────────────────
{
  const buildings: BuildingRow[] = [{ id: "f1", type: "INDUSTRIAL" }];
  const r = computeEfficiency({ bills: [bill(1_200_000, "f1")], buildings });
  check(r.annualSavingInr > 0, "P1 industrial → positive savings");
  check(has("vfd", r) && has("compressed-air", r), "P1 industrial → VFD + compressed-air ECMs surface");
  check(!has("envelope", r), "P1 industrial → no commercial-only ECM (cool roof)");
  check(r.measures[0].annualSavingInr >= r.measures[r.measures.length - 1].annualSavingInr, "P1 measures ranked by savings");
  check(r.pctOfConsumption > 0 && r.pctOfConsumption <= 30, "P1 reduction within 0–30% ceiling");
  check(r.blendedRateInr === 8, "P1 blended rate = ₹8/kWh from bills");
}

// ── Persona 2: "Orchid Towers" — COMMERCIAL office ─────────────────────────────
{
  const buildings: BuildingRow[] = [{ id: "c1", type: "COMMERCIAL" }];
  const r = computeEfficiency({ bills: [bill(600_000, "c1")], buildings });
  check(has("hvac", r) && has("led", r), "P2 commercial → HVAC + LED ECMs surface");
  check(!has("compressed-air", r), "P2 commercial → no industrial-only ECM (compressed air)");
  check(r.measures[0].id === "hvac", "P2 commercial → HVAC is the top measure");
  check(r.measures.every((m) => m.capexInr === Math.round(m.annualSavingInr * m.paybackYrs)), "P2 capex = savings × benchmark payback");
}

// ── Persona 3: savings scale linearly with consumption ─────────────────────────
{
  const b: BuildingRow[] = [{ id: "c1", type: "COMMERCIAL" }];
  const small = computeEfficiency({ bills: [bill(100_000, "c1")], buildings: b }).annualSavingInr;
  const big = computeEfficiency({ bills: [bill(1_000_000, "c1")], buildings: b }).annualSavingInr;
  check(big > small * 8 && big < small * 12, "P3 10× the kWh → ~10× the savings (scales with consumption)");
}

// ── Persona 4: mixed portfolio (industrial + commercial) ───────────────────────
{
  const buildings: BuildingRow[] = [{ id: "f1", type: "INDUSTRIAL" }, { id: "c1", type: "COMMERCIAL" }];
  const r = computeEfficiency({ bills: [bill(1_000_000, "f1"), bill(400_000, "c1")], buildings });
  check(has("vfd", r) && has("hvac", r), "P4 mixed → both industrial & commercial ECMs present");
  check(r.totalKwh === 1_400_000, "P4 totalKwh = sum across sites");
  check(r.annualSavingInr <= r.totalKwh * 0.3 * 8, "P4 total savings within the 30% × rate ceiling");
}

// ── Persona 5: brand-new org, no bills — nothing fabricated ────────────────────
{
  const empty: EfficiencyInput = { bills: [], buildings: [] };
  const r = computeEfficiency(empty);
  check(r.annualSavingInr === 0 && r.measures.length === 0, "P5 no bills → zero savings, no measures");
  check(r.pctOfConsumption === 0 && Number.isFinite(r.blendedRateInr), "P5 no NaN on empty org");
  // A bill with no building defaults to a commercial profile (not skipped).
  const r2 = computeEfficiency({ bills: [bill(500_000, null)], buildings: [] });
  check(r2.annualSavingInr > 0 && has("hvac", r2), "P5 unattributed bill → commercial profile applied");
}

if (failures > 0) {
  console.error(`\n${failures} efficiency invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll efficiency engine invariants hold.");
