/**
 * Customer-angle test: the diagnosis engine across MULTIPLE DISCOMs (runs in CI).
 *
 * Persona — "Bharat Multi-Site Pvt Ltd": a company with 8 sites on 8 different
 * DISCOMs (MSEDCL, BESCOM, TANGEDCO, TPDDL, BSES, Adani, UPPCL, TSSPDCL). Each
 * bill below is a realistic reconstruction grounded in that DISCOM's real bill
 * format (demand in kVA, kVAh/PF billing, FAC, electricity duty, fixed charges,
 * ToD; service-no/CA-no/account-id labels) — sources in docs/OCR-STRATEGY.md.
 *
 * NOTE: this tests the DETERMINISTIC engine (fields → ₹), not live vision-OCR
 * (which needs the backend API key — that test runs on the live backend, see
 * docs/TODO.md). It asserts production guarantees: no false positives, sane ₹,
 * correct per-DISCOM behaviour. Exits non-zero on any failure.
 */

import { fullDiagnose, type ExtractedField } from "../src/diagnosis/engine";

type Bill = Record<string, string | number>;
const F = (b: Bill): ExtractedField[] => Object.entries(b).map(([key, value]) => ({ key, value: String(value) }));

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}
function run(name: string, b: Bill) {
  const d = fullDiagnose(F(b));
  const status = (id: string) => d.results.find((r) => r.check.id === id)?.status;
  const annual = (id: string) => d.results.find((r) => r.check.id === id)?.annualINR;
  // Universal production invariants for every bill, every DISCOM.
  check(d.counts.total === 58, `${name}: all 58 checks run`);
  check(Number.isFinite(d.recoverableINR) && d.recoverableINR >= 0, `${name}: recoverable is a sane ₹ (≥0, finite)`);
  check(Number.isFinite(d.opportunityINR) && d.opportunityINR >= 0, `${name}: opportunity is a sane ₹ (≥0, finite)`);
  check(d.results.every((r) => r.annualINR === undefined || Number.isFinite(r.annualINR)), `${name}: no NaN/∞ in any finding`);
  return { d, status, annual };
}

console.log("Diagnosis engine — multi-DISCOM customer-angle test (persona: Bharat Multi-Site Pvt Ltd):");

// 1) MSEDCL HT-I industrial (Pune) — kVAh billing, low PF with penalty, ToD, floor-based billing demand.
{
  const { status } = run("MSEDCL HT-I", {
    discom: "MSEDCL", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", sanctionedLoadKw: 1200,
    contractDemandKva: 1500, maxDemandKva: 1100, billingDemandKva: 1125, fixedDemandCharges: 506250,
    powerFactor: 0.91, pfPenaltyAmt: 62000, apparentKvah: 520000, energyKwh: 475000, energyCharges: 3600000,
    todPeakKwh: 142000, todOffPeakKwh: 190000, todNormalKwh: 143000, todPeakRate: 9.6, todOffPeakRate: 5.8,
    arrears: 0,
  });
  check(status("2.1") === "loss", "MSEDCL: PF penalty (2.1) detected");
  check(status("1.3") === "healthy", "MSEDCL: 75%-of-contract billing demand NOT mis-flagged (1.3)");
}

// 2) BESCOM HT-2 commercial (Bengaluru mall) — high PF, high tariff → open-access opportunity.
{
  const { status } = run("BESCOM HT-2", {
    discom: "BESCOM", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-2 (Commercial)", sanctionedLoadKw: 2000,
    contractDemandKva: 2500, maxDemandKva: 2300, billingDemandKva: 2300, fixedDemandCharges: 1035000,
    powerFactor: 0.96, energyKwh: 920000, energyCharges: 6900000, apparentKvah: 958000,
  });
  check(status("7.1") === "loss", "BESCOM: open-access opportunity (7.1) surfaced");
}

// 3) TANGEDCO HT industrial (Chennai cold storage) — low PF with penalty.
{
  const { status } = run("TANGEDCO HT-IA", {
    discom: "TANGEDCO", supplyVoltage: "HT (22 kV)", tariffCategory: "HT Tariff IA", sanctionedLoadKw: 700,
    contractDemandKva: 900, maxDemandKva: 820, billingDemandKva: 820, fixedDemandCharges: 369000,
    powerFactor: 0.88, pfPenaltyAmt: 41000, energyKwh: 310000, energyCharges: 2480000,
  });
  check(status("2.1") === "loss", "TANGEDCO: PF penalty (2.1) detected");
}

// 4) TPDDL LT commercial (Delhi office, small) — must produce ZERO false positives.
{
  const { d, status } = run("TPDDL LT", {
    discom: "Tata Power-DDL", supplyVoltage: "LT 415V", tariffCategory: "LT-Commercial", sanctionedLoadKw: 60,
    powerFactor: 0.94, energyKwh: 18000, energyCharges: 144000, fixedDemandCharges: 9000,
  });
  check(status("3.4") === "healthy", "TPDDL: ToD not mis-flagged for a small LT consumer (3.4)");
  check(d.recoverableINR === 0 && d.counts.losses === 0, "TPDDL: clean small LT bill → ₹0, no false positives");
}

// 5) BSES Rajdhani HT (Delhi) — recorded demand exceeds contract.
{
  const { status } = run("BSES HT", {
    discom: "BSES Rajdhani", supplyVoltage: "HT (11 kV)", tariffCategory: "HT", sanctionedLoadKw: 700,
    contractDemandKva: 800, maxDemandKva: 900, billingDemandKva: 900, fixedDemandCharges: 360000,
    powerFactor: 0.97, energyKwh: 290000, energyCharges: 2200000,
  });
  check(status("1.2") === "loss", "BSES: demand-exceeded-contract (1.2) detected");
}

// 6) Adani Mumbai HT commercial — ALREADY on open access (wheeling + CSS present).
{
  const { status } = run("Adani HT-II", {
    discom: "Adani Electricity", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-II (Commercial)", sanctionedLoadKw: 1300,
    contractDemandKva: 1650, maxDemandKva: 1500, billingDemandKva: 1500, fixedDemandCharges: 675000,
    powerFactor: 0.99, energyKwh: 600000, energyCharges: 4200000, wheelingCharges: 85000, crossSubsidySurcharge: 120000,
  });
  check(status("7.1") === "healthy", "Adani: no false 'switch to open access' when already on it (7.1)");
}

// 7) UPPCL HT industrial (UP) — arrears present: flagged, but NEVER counted as savings.
{
  const { status, annual } = run("UPPCL HT", {
    discom: "UPPCL", supplyVoltage: "HT (11 kV)", tariffCategory: "HV-2", sanctionedLoadKw: 900,
    contractDemandKva: 1000, maxDemandKva: 920, billingDemandKva: 920, fixedDemandCharges: 414000,
    powerFactor: 0.94, energyKwh: 400000, energyCharges: 2400000, arrears: 250000,
  });
  check(status("6.5") === "loss", "UPPCL: arrears flagged for review (6.5)");
  check(annual("6.5") === undefined, "UPPCL: arrears contribute ₹0 to recoverable savings (not annualised)");
}

// 8) TSSPDCL HT commercial (Hyderabad) — low utilisation, contract-demand floor billing.
{
  const { status } = run("TSSPDCL HT", {
    discom: "TSSPDCL", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-II", sanctionedLoadKw: 1000,
    contractDemandKva: 1150, maxDemandKva: 600, billingDemandKva: 862, fixedDemandCharges: 387900,
    powerFactor: 0.96, energyKwh: 350000, energyCharges: 2625000,
  });
  check(status("1.3") === "healthy", "TSSPDCL: floor-based billing demand NOT mis-flagged (1.3)");
  check(status("1.1") === "loss", "TSSPDCL: over-sized contract demand (1.1) surfaced");
}

if (failures > 0) {
  console.error(`\n${failures} multi-DISCOM persona check(s) failed.`);
  process.exit(1);
}
console.log("\nAll multi-DISCOM persona checks hold.");
