/**
 * Bill diagnosis engine — server port of the frontend lib/diagnosis.ts.
 * Identical logic (same detectors, same no-false-positive guards, same
 * recoverable/opportunity buckets). The only change is a self-contained
 * ExtractedField type instead of importing the frontend's.
 */

import {
  LOSS_CHECKS,
  CATEGORIES,
  DATA_NEED_LABELS,
  type DataNeed,
  type LossCheck,
} from "./loss-taxonomy";

export type ExtractedField = { key: string; value: string };

export type CheckStatus = "loss" | "healthy" | "needs_data";
export type CheckKind = "recoverable" | "opportunity";

export type CheckResult = {
  check: LossCheck;
  kind: CheckKind;
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

export type DataGap = { need: string; label: string; checks: LossCheck[] };

export type FullDiagnosis = {
  results: CheckResult[];
  recoverableINR: number;
  opportunityINR: number;
  recoverable: CheckResult[];
  opportunities: CheckResult[];
  byCategory: CategorySummary[];
  counts: { total: number; losses: number; healthy: number; needsData: number };
  gaps: DataGap[];
  top: CheckResult[];
};

function kindForCategory(category: number): CheckKind {
  return category === 7 || category === 8 ? "opportunity" : "recoverable";
}

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

/** Power factor as a 0–1 decimal, tolerant of bills/entries that use % (96 → 0.96). */
function pf01(n: (k: string) => number): number {
  const p = n("powerFactor");
  return p > 1.5 ? p / 100 : p;
}

function ratePerKva(n: (k: string) => number): number {
  const bd = n("billingDemandKva");
  const fc = n("fixedDemandCharges");
  return bd > 0 && fc > 0 ? fc / bd : 450;
}

type Det = (
  n: (k: string) => number,
  fields: ExtractedField[],
) => { status: CheckStatus; annualINR?: number; note?: string };

const detectors: Record<string, Det> = {
  "1.1": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    if (cd <= 0 || md <= 0) return { status: "healthy" };
    if (md < 0.85 * cd) {
      const rec = Math.ceil((md * 1.15) / 10) * 10;
      if (rec >= cd) return { status: "healthy" };
      return {
        status: "loss",
        annualINR: Math.round((cd - rec) * ratePerKva(n) * 12),
        note: `Peak ${md} of ${cd} kVA this month — confirm with 12-month history`,
      };
    }
    return { status: "healthy" };
  },
  "1.2": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    if (cd <= 0 || md <= 0) return { status: "healthy" };
    return md > cd
      ? { status: "loss", annualINR: Math.round((md - cd) * ratePerKva(n) * 1.75 * 12), note: "Demand exceeded the contract this month — recurring if it repeats; confirm with 12-month history" }
      : { status: "healthy" };
  },
  // Genuine over-billing ONLY when billing demand exceeds both recorded MD and
  // the tariff's contract-demand floor (~75% of CD); without CD, don't flag.
  "1.3": (n) => {
    const bd = n("billingDemandKva");
    const md = n("maxDemandKva");
    const cd = n("contractDemandKva");
    if (md <= 0 || bd <= 0 || cd <= 0) return { status: "healthy" };
    const expected = Math.max(md, 0.75 * cd);
    return bd > expected * 1.05
      ? { status: "loss", annualINR: Math.round((bd - expected) * ratePerKva(n) * 12), note: "Billed demand exceeds both recorded demand and the contract-demand floor" }
      : { status: "healthy" };
  },
  "1.4": (n) => {
    const lf = n("loadFactorPct");
    const fc = n("fixedDemandCharges");
    return lf > 0 && lf < 40 && fc > 0
      ? { status: "loss", annualINR: Math.round(fc * 12 * 0.15), note: `Load factor only ${lf}%` }
      : { status: "healthy" };
  },
  "2.1": (n) => {
    const pf = pf01(n);
    const pen = n("pfPenaltyAmt");
    return pf > 0 && pf < 0.95 && pen > 0
      ? { status: "loss", annualINR: Math.round(pen * 12), note: `Power factor ${pf.toFixed(2)}` }
      : { status: "healthy" };
  },
  "2.2": (n) => {
    if (n("pfPenaltyAmt") > 0) return { status: "healthy", note: "kWh-based billing" };
    const pf = pf01(n);
    const kvah = n("apparentKvah");
    const kwh = n("energyKwh");
    const ec = n("energyCharges");
    if (pf > 0 && pf < 0.95 && kwh > 0 && kvah > kwh && ec > 0) {
      const rate = ec / kwh;
      return { status: "loss", annualINR: Math.round((kvah - kwh) * rate * 12), note: "kVAh billed above kWh used" };
    }
    return { status: "healthy" };
  },
  "2.3": (n) => {
    const pf = pf01(n);
    const fc = n("fixedDemandCharges");
    return pf >= 0.95 && fc > 0 && n("pfPenaltyAmt") === 0
      ? { status: "loss", annualINR: Math.round(fc * 0.02 * 12), note: "If not already credited, you may be eligible for a high-PF rebate (~2% of demand charges) — verify" }
      : { status: "healthy" };
  },
  "3.1": (n) => {
    const p = n("todPeakKwh");
    const pr = n("todPeakRate");
    const off = n("todOffPeakRate");
    return p > 0 && pr > 0 && off > 0 && pr > off
      ? { status: "loss", annualINR: Math.round(p * 0.2 * (pr - off) * 12), note: "Shift ~20% of peak load to off-peak" }
      : { status: "healthy" };
  },
  // Only flag ToD-eligible consumers (HT supply or ≥100 kW) — avoids a false
  // positive for LT/small consumers who have no ToD option.
  "3.4": (n, fields) => {
    const anyTod = n("todPeakKwh") + n("todOffPeakKwh") + n("todNormalKwh");
    const ec = n("energyCharges");
    const eligible = str(fields, "supplyVoltage").includes("HT") || n("sanctionedLoadKw") >= 100;
    return anyTod === 0 && ec > 0 && n("maxDemandKva") > 0 && eligible
      ? { status: "loss", annualINR: Math.round(ec * 0.05 * 12), note: "No ToD slabs shown — if eligible, ToD-aware scheduling can cut energy cost" }
      : { status: "healthy" };
  },
  "5.2": (n, fields) => {
    const v = str(fields, "supplyVoltage");
    const t = str(fields, "tariffCategory");
    const ec = n("energyCharges");
    const mismatch = (v.includes("HT") && t.includes("LT")) || (v.includes("LT") && t.includes("HT"));
    return mismatch && ec > 0
      ? { status: "loss", annualINR: Math.round(ec * 0.07 * 12), note: "Voltage level and tariff category disagree" }
      : { status: "healthy" };
  },
  // Arrears are money OWED, not a saving — flagged for review but contribute ₹0
  // to recoverable savings (no annualINR), so they never inflate the headline.
  "6.5": (n) => {
    const a = n("arrears");
    return a > 0
      ? { status: "loss", note: `Arrears of ₹${Math.round(a)} on the bill — money owed, not a saving; verify it's legitimate` }
      : { status: "healthy" };
  },
  "7.1": (n) => {
    const kwh = n("energyKwh");
    const ec = n("energyCharges");
    const rate = kwh > 0 ? ec / kwh : 0;
    const onOA = n("wheelingCharges") > 0 || n("crossSubsidySurcharge") > 0;
    return !onOA && rate > 6.5 && ec > 0 && n("sanctionedLoadKw") >= 100
      ? { status: "loss", annualINR: Math.round(ec * 0.12 * 12), note: `Energy at ₹${rate.toFixed(1)}/kWh — open access could cut it` }
      : { status: "healthy" };
  },
  "9.4": (n) => {
    const l = n("latePaymentSurcharge");
    return l > 0 ? { status: "loss", annualINR: Math.round(l * 12), note: "Recurring late-payment surcharge" } : { status: "healthy" };
  },
  "9.7": () => ({ status: "healthy" }),
};

export function fullDiagnose(fields: ExtractedField[]): FullDiagnosis {
  const n = makeNum(fields);

  const results: CheckResult[] = LOSS_CHECKS.map((check) => {
    const kind = kindForCategory(check.category);
    const det = detectors[check.id];
    if (det) {
      const r = det(n, fields);
      return { check, kind, status: r.status, annualINR: r.annualINR, note: r.note };
    }
    return { check, kind, status: "needs_data" };
  });

  const losses = results.filter((r) => r.status === "loss");
  const recoverable = losses.filter((r) => r.kind === "recoverable");
  const opportunities = losses.filter((r) => r.kind === "opportunity");
  const sum = (rs: CheckResult[]) => rs.reduce((s, r) => s + (r.annualINR ?? 0), 0);

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

  const top = [...recoverable].sort((a, b) => (b.annualINR ?? 0) - (a.annualINR ?? 0)).slice(0, 3);

  return {
    results,
    recoverableINR: sum(recoverable),
    opportunityINR: sum(opportunities),
    recoverable: [...recoverable].sort((a, b) => (b.annualINR ?? 0) - (a.annualINR ?? 0)),
    opportunities: [...opportunities].sort((a, b) => (b.annualINR ?? 0) - (a.annualINR ?? 0)),
    byCategory,
    counts,
    gaps,
    top,
  };
}
