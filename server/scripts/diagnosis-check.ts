/**
 * Diagnosis-engine invariant checks (runs in CI — `ts-node --transpile-only`).
 *
 * This is the high-stakes guard: the ₹ numbers the engine produces drive real
 * decisions, so we lock its NO-FALSE-POSITIVE guarantees against regression.
 * These assert behaviour on hand-built bills, not exact ₹ — each encodes a real
 * failure mode we must never reintroduce. Exits non-zero on any failure.
 */

import { fullDiagnose, type ExtractedField } from "../src/diagnosis/engine";

function bill(obj: Record<string, string | number>): ExtractedField[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
}

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ok   ${msg}`);
  } else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}
function status(d: ReturnType<typeof fullDiagnose>, id: string): string | undefined {
  return d.results.find((r) => r.check.id === id)?.status;
}

console.log("Diagnosis engine invariants:");

// 1. Contract-demand FLOOR must not be flagged as over-billing (1.3).
//    Billing demand = 75% of contract demand, MD lower — this is legitimate.
{
  const d = fullDiagnose(
    bill({ contractDemandKva: 1000, maxDemandKva: 600, billingDemandKva: 750, fixedDemandCharges: 337500, energyCharges: 100000 }),
  );
  check(status(d, "1.3") === "healthy", "1.3 does NOT fire on a legitimate 75%-of-contract billing-demand floor");
}

// 2. Genuine over-billing (bd above MD and the floor) SHOULD fire (1.3).
{
  const d = fullDiagnose(
    bill({ contractDemandKva: 1000, maxDemandKva: 600, billingDemandKva: 950, fixedDemandCharges: 427500, energyCharges: 100000 }),
  );
  check(status(d, "1.3") === "loss", "1.3 fires when billing demand exceeds both MD and the floor");
}

// 3. Arrears are NEVER counted as recoverable savings (6.5).
{
  const d = fullDiagnose(bill({ arrears: 50000 }));
  check(d.recoverableINR === 0, "arrears alone yields ₹0 recoverable savings (not counted as a saving)");
  check(status(d, "6.5") === "loss", "arrears still surface as a flagged review item");
}

// 4. ToD-not-applied must not fire for ToD-INELIGIBLE (LT / small) consumers (3.4).
{
  const lt = fullDiagnose(bill({ supplyVoltage: "LT 415V", sanctionedLoadKw: 50, energyCharges: 100000, maxDemandKva: 100 }));
  check(status(lt, "3.4") === "healthy", "3.4 does NOT fire for an LT / sub-100kW consumer with no ToD slabs");
  const ht = fullDiagnose(bill({ supplyVoltage: "HT (22 kV)", sanctionedLoadKw: 800, energyCharges: 100000, maxDemandKva: 600 }));
  check(status(ht, "3.4") === "loss", "3.4 does fire for an HT / large consumer with no ToD slabs");
}

// 5. Power factor entered as a percentage (92 → 0.92) must not mis-fire the
//    high-PF rebate (2.3) — 0.92 is below the 0.95 threshold.
{
  const d = fullDiagnose(bill({ powerFactor: 92, fixedDemandCharges: 337500 }));
  check(status(d, "2.3") === "healthy", "2.3 does NOT mis-fire when PF is given as a percentage (92 → 0.92)");
}

// 6. A clean, well-formed bill must produce ZERO recoverable findings.
{
  const d = fullDiagnose(
    bill({
      supplyVoltage: "LT 415V", tariffCategory: "LT-II", sanctionedLoadKw: 50,
      contractDemandKva: 1000, maxDemandKva: 900, billingDemandKva: 900,
      powerFactor: 0.94, energyKwh: 100000, energyCharges: 500000, fixedDemandCharges: 337500,
    }),
  );
  check(d.recoverableINR === 0, "a clean bill yields ₹0 recoverable (no false positives)");
  check(d.counts.losses === 0, "a clean bill yields zero loss findings");
}

if (failures > 0) {
  console.error(`\n${failures} invariant(s) failed.`);
  process.exit(1);
}
console.log("\nAll diagnosis invariants hold.");
