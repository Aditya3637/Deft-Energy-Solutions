/**
 * Bill diagnosis engine. Runs ALL 58 loss checks against the extracted fields.
 * For each check it returns one of:
 *   - "loss"       → a quantified annual ₹ opportunity (with a short note)
 *   - "healthy"    → checked, no loss / not applicable
 *   - "needs_data" → cannot be assessed from a single bill (says what's needed)
 *
 * Only the assessable (bill-only) checks have detectors here; everything else
 * falls through to "needs_data" using the check's declared `needs`.
 */

import type { ExtractedField } from "@/lib/mock/bill";
import {
  LOSS_CHECKS,
  CATEGORIES,
  DATA_NEED_LABELS,
  type DataNeed,
  type LossCheck,
} from "@/lib/loss-taxonomy";

export type CheckStatus = "loss" | "healthy" | "needs_data";

export type CheckResult = {
  check: LossCheck;
  status: CheckStatus;
  annualINR?: number;
  note?: string;
};

export type CategorySummary = {
  n: number;
  name: string;
  annualINR: number;
  losses: number;
  needsData: number;
  total: number;
};

export type DataGap = {
  need: string;
  label: string;
  checks: LossCheck[];
};

export type FullDiagnosis = {
  results: CheckResult[];
  totalAnnualINR: number;
  byCategory: CategorySummary[];
  counts: { total: number; losses: number; healthy: number; needsData: number };
  gaps: DataGap[];
  top: CheckResult[];
};

function makeNum(fields: ExtractedField[]) {
  return (key: string): number => {
    const raw = fields.find((f) => f.key === key)?.value ?? "0";
    const n = parseFloat(raw.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
}
function str(fields: ExtractedField[], key: string): string {
  return (fields.find((f) => f.key === key)?.value ?? "").toUpperCase();
}

const DEMAND_RATE = 450; // ₹ / kVA / month (illustrative)

type Detector = (
  n: (k: string) => number,
  fields: ExtractedField[],
) => { status: CheckStatus; annualINR?: number; note?: string };

const detectors: Record<string, Detector> = {
  "1.1": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    if (cd > 0 && md < 0.85 * cd) {
      const rec = Math.ceil((md * 1.1) / 10) * 10;
      return { status: "loss", annualINR: (cd - rec) * DEMAND_RATE * 12, note: `Demand peaks at ${md} of ${cd} kVA` };
    }
    return { status: "healthy" };
  },
  "1.2": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    return md > cd
      ? { status: "loss", annualINR: Math.round((md - cd) * DEMAND_RATE * 1.75 * 12), note: "Demand exceeded contract" }
      : { status: "healthy" };
  },
  "1.3": (n) => {
    const bd = n("billingDemandKva");
    const md = n("maxDemandKva");
    return bd > md * 1.05
      ? { status: "loss", annualINR: (bd - md) * DEMAND_RATE * 12, note: "Billed above actual demand" }
      : { status: "healthy" };
  },
  "1.4": (n) => {
    const lf = n("loadFactorPct");
    return lf > 0 && lf < 40
      ? { status: "loss", annualINR: Math.round(n("fixedDemandCharges") * 12 * 0.15), note: `Load factor only ${lf}%` }
      : { status: "healthy" };
  },
  "2.1": (n) => {
    const pf = n("powerFactor");
    const pen = n("pfPenaltyAmt");
    return pf < 0.95 && pen > 0
      ? { status: "loss", annualINR: pen * 12, note: `Power factor ${pf.toFixed(2)}` }
      : { status: "healthy" };
  },
  "2.2": (n) => {
    if (n("pfPenaltyAmt") > 0) return { status: "healthy", note: "kWh-based billing" };
    const pf = n("powerFactor");
    const kvah = n("apparentKvah");
    const kwh = n("energyKwh");
    if (pf > 0 && pf < 0.95 && kvah > kwh && kwh > 0) {
      const rate = n("energyCharges") / kwh;
      return { status: "loss", annualINR: Math.round((kvah - kwh) * rate * 12), note: "kVAh billed above kWh used" };
    }
    return { status: "healthy" };
  },
  "2.3": (n) => {
    const pf = n("powerFactor");
    return pf >= 0.95 && n("pfPenaltyAmt") === 0
      ? { status: "loss", annualINR: Math.round(n("fixedDemandCharges") * 0.02 * 12), note: "Eligible for a high-PF rebate" }
      : { status: "healthy" };
  },
  "3.1": (n) => {
    const p = n("todPeakKwh");
    const pr = n("todPeakRate");
    const off = n("todOffPeakRate");
    return p > 0 && pr > off
      ? { status: "loss", annualINR: Math.round(p * 0.2 * (pr - off) * 12), note: "Shiftable peak-hour load" }
      : { status: "healthy" };
  },
  "3.4": (n) => {
    const p = n("todPeakKwh");
    return p === 0 && n("maxDemandKva") > 0
      ? { status: "loss", annualINR: Math.round(n("energyCharges") * 0.05 * 12), note: "No ToD breakdown despite eligibility" }
      : { status: "healthy" };
  },
  "5.2": (n, fields) => {
    const v = str(fields, "supplyVoltage");
    const t = str(fields, "tariffCategory");
    const mismatch = (v.includes("HT") && t.includes("LT")) || (v.includes("LT") && t.includes("HT"));
    return mismatch
      ? { status: "loss", annualINR: Math.round(n("energyCharges") * 0.07 * 12), note: "Voltage / tariff mismatch" }
      : { status: "healthy" };
  },
  "5.6": (n) => {
    return n("earlyPaymentRebate") === 0
      ? { status: "loss", annualINR: Math.round(n("totalAmountDue") * 0.005 * 12), note: "No prompt-payment rebate claimed" }
      : { status: "healthy" };
  },
  "6.5": (n) => {
    const a = n("arrears");
    return a > 0 ? { status: "loss", annualINR: Math.round(a), note: "Arrears to review (one-time)" } : { status: "healthy" };
  },
  "7.1": (n) => {
    const kwh = n("energyKwh");
    const total = n("totalAmountDue");
    const eff = kwh > 0 ? total / kwh : 0;
    const onOA = n("wheelingCharges") > 0 || n("crossSubsidySurcharge") > 0;
    return !onOA && eff > 7.5 && n("sanctionedLoadKw") >= 100
      ? { status: "loss", annualINR: Math.round(kwh * 1.0 * 12), note: `Effective ₹${eff.toFixed(1)}/kWh — open access viable` }
      : { status: "healthy" };
  },
  "9.4": (n) => {
    const l = n("latePaymentSurcharge");
    return l > 0 ? { status: "loss", annualINR: l * 12, note: "Recurring late-payment surcharge" } : { status: "healthy" };
  },
  "9.7": () => ({ status: "healthy" }),
};

export function fullDiagnose(fields: ExtractedField[]): FullDiagnosis {
  const n = makeNum(fields);

  const results: CheckResult[] = LOSS_CHECKS.map((check) => {
    const det = detectors[check.id];
    if (det) {
      const r = det(n, fields);
      return { check, status: r.status, annualINR: r.annualINR, note: r.note };
    }
    return { check, status: "needs_data" };
  });

  const losses = results.filter((r) => r.status === "loss");
  const totalAnnualINR = losses.reduce((s, r) => s + (r.annualINR ?? 0), 0);

  const byCategory: CategorySummary[] = CATEGORIES.map((c) => {
    const rs = results.filter((r) => r.check.category === c.n);
    return {
      n: c.n,
      name: c.name,
      annualINR: rs.filter((r) => r.status === "loss").reduce((s, r) => s + (r.annualINR ?? 0), 0),
      losses: rs.filter((r) => r.status === "loss").length,
      needsData: rs.filter((r) => r.status === "needs_data").length,
      total: rs.length,
    };
  });

  const counts = {
    total: results.length,
    losses: losses.length,
    healthy: results.filter((r) => r.status === "healthy").length,
    needsData: results.filter((r) => r.status === "needs_data").length,
  };

  // Group the unassessable checks by the data they need.
  const gapMap = new Map<string, LossCheck[]>();
  for (const r of results) {
    if (r.status !== "needs_data") continue;
    for (const need of r.check.needs) {
      if (!gapMap.has(need)) gapMap.set(need, []);
      gapMap.get(need)!.push(r.check);
    }
  }
  const gaps: DataGap[] = [...gapMap.entries()]
    .map(([need, checks]) => ({ need, label: DATA_NEED_LABELS[need as DataNeed], checks }))
    .sort((a, b) => b.checks.length - a.checks.length);

  const top = [...losses].sort((a, b) => (b.annualINR ?? 0) - (a.annualINR ?? 0)).slice(0, 3);

  return { results, totalAnnualINR, byCategory, counts, gaps, top };
}
