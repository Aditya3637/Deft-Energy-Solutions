/**
 * The Savings Stack — the one place the whole money story adds up. Each rung is
 * a distinct mechanism by which Deft moves money on an electricity bill, with a
 * ₹ value attributed to it and an honest state:
 *   live       — quantified from the org's real data (counts toward the headline)
 *   potential  — an estimate/indicative upside (shown, not added to the headline)
 *   needs-data — we can't quantify it yet (a call to action, e.g. efficiency)
 *
 * Pure + deterministic: the page feeds it numbers already computed by the live
 * seams (diagnosis, open access, BESS, carbon); nothing is invented here.
 */

export type RungKey = "recover" | "reduce" | "reprice" | "generate" | "earn";
export type RungState = "live" | "potential" | "needs-data";

export type Rung = {
  key: RungKey;
  title: string;
  blurb: string;
  /** Annual ₹ (live), indicative ₹ (potential), or null (needs-data). */
  annualINR: number | null;
  state: RungState;
  href: string;
};

export type SavingsStack = {
  spendINR: number;
  /** Sum of the `live` rungs — the defensible headline number. */
  identifiedAnnualINR: number;
  /** Sum of the `potential` rungs — extra upside, shown separately. */
  potentialAnnualINR: number;
  /** identified ÷ spend, as a whole percent (0 when spend is 0). */
  pctOfSpend: number;
  /** Largest rung value, for sizing the bars. */
  maxRungINR: number;
  rungs: Rung[];
};

export type StackInputs = {
  annualSpendINR: number;
  recoverableINR: number; // diagnosis: PF / CD / tariff / billing-error / late-fee
  oaEligible: boolean;
  oaAnnualINR: number; // open access vs grid tariff
  bessAnnualINR: number; // BESS demand-shave + arbitrage
  carbonValueINR: number; // carbon-credit value (potential) + payments/DR upside
};

const clampPct = (n: number) => Math.max(0, Math.round(n));

export function buildSavingsStack(input: StackInputs): SavingsStack {
  const rungs: Rung[] = [
    {
      key: "recover",
      title: "Recover — bill leakages & hidden costs",
      blurb: "Power factor, contract demand, tariff fit, billing errors, late fees. No capex, immediate.",
      annualINR: input.recoverableINR > 0 ? input.recoverableINR : 0,
      state: input.recoverableINR > 0 ? "live" : "needs-data",
      href: "/app/bills",
    },
    {
      key: "reduce",
      title: "Reduce — cut the consumption itself",
      blurb: "Efficiency retrofits (LED, HVAC, VFD, compressed air). The cheapest unit is the one you don't use.",
      annualINR: null, // efficiency engine not yet measuring — the missing rung
      state: "needs-data",
      href: "/app/analytics",
    },
    {
      key: "reprice",
      title: "Reprice — buy power cheaper",
      blurb: "Open access + the power exchange (IEX/PXIL) vs your DISCOM tariff.",
      annualINR: input.oaEligible ? Math.max(0, input.oaAnnualINR) : 0,
      state: input.oaEligible && input.oaAnnualINR > 0 ? "live" : "needs-data",
      href: "/app/markets",
    },
    {
      key: "generate",
      title: "Generate — produce & store your own",
      blurb: "Battery storage (peak-shaving + arbitrage), solar, microgrid and VPP.",
      annualINR: input.bessAnnualINR > 0 ? input.bessAnnualINR : 0,
      state: input.bessAnnualINR > 0 ? "live" : "needs-data",
      href: "/app/assets",
    },
    {
      key: "earn",
      title: "Earn — money back",
      blurb: "Carbon credits (CCTS), demand-response revenue and bill-payment cashback.",
      annualINR: input.carbonValueINR > 0 ? input.carbonValueINR : 0,
      state: input.carbonValueINR > 0 ? "potential" : "needs-data",
      href: "/app/carbon",
    },
  ];

  const live = (r: Rung) => r.state === "live" && r.annualINR != null;
  const potential = (r: Rung) => r.state === "potential" && r.annualINR != null;
  const identifiedAnnualINR = rungs.filter(live).reduce((s, r) => s + (r.annualINR ?? 0), 0);
  const potentialAnnualINR = rungs.filter(potential).reduce((s, r) => s + (r.annualINR ?? 0), 0);
  const maxRungINR = Math.max(1, ...rungs.map((r) => r.annualINR ?? 0));

  return {
    spendINR: input.annualSpendINR,
    identifiedAnnualINR,
    potentialAnnualINR,
    pctOfSpend: input.annualSpendINR > 0 ? clampPct((identifiedAnnualINR / input.annualSpendINR) * 100) : 0,
    maxRungINR,
    rungs,
  };
}
