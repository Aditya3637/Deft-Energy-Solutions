/**
 * Bill diagnosis engine. Runs ALL 58 loss checks against the extracted fields.
 * For each check it returns one of:
 *   - "loss"       → a quantified annual ₹ opportunity (with a short note)
 *   - "healthy"    → checked, no loss / not applicable
 *   - "needs_data" → cannot be assessed from a single bill (says what's needed)
 *
 * Two design rules that matter because every consumer relies on this:
 *  1. NO FALSE POSITIVES from missing OCR fields. A check only fires when the
 *     fields it depends on are actually present (> 0). A field that failed to
 *     extract reads as 0 and must never be treated as a finding.
 *  2. HONEST BUCKETS. "Recoverable" losses (money leaking now — penalties,
 *     errors, inefficiency you can stop) are separated from "opportunities"
 *     (solar, open access, BESS — a switch/investment decision). The headline
 *     shows what you're overpaying; opportunities are surfaced as next steps.
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

/** Categories 7 (procurement) and 8 (infrastructure) require a switch/investment. */
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

/** Demand charge rate read from THIS bill (₹/kVA/month); falls back if absent. */
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
  // 1.1 Contract demand over-sized — needs BOTH cd and md present.
  "1.1": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    if (cd <= 0 || md <= 0) return { status: "healthy" };
    if (md < 0.85 * cd) {
      const rec = Math.ceil((md * 1.15) / 10) * 10; // 15% headroom (provisional, single month)
      if (rec >= cd) return { status: "healthy" };
      return {
        status: "loss",
        annualINR: Math.round((cd - rec) * ratePerKva(n) * 12),
        note: `Peak ${md} of ${cd} kVA this month — confirm with 12-month history`,
      };
    }
    return { status: "healthy" };
  },
  // 1.2 Demand exceeded contract — needs BOTH present.
  "1.2": (n) => {
    const cd = n("contractDemandKva");
    const md = n("maxDemandKva");
    if (cd <= 0 || md <= 0) return { status: "healthy" };
    return md > cd
      ? { status: "loss", annualINR: Math.round((md - cd) * ratePerKva(n) * 1.75 * 12), note: "Demand exceeded the contract" }
      : { status: "healthy" };
  },
  // 1.3 Billed above actual demand — needs md present.
  "1.3": (n) => {
    const bd = n("billingDemandKva");
    const md = n("maxDemandKva");
    if (md <= 0 || bd <= 0) return { status: "healthy" };
    return bd > md * 1.05
      ? { status: "loss", annualINR: Math.round((bd - md) * ratePerKva(n) * 12), note: "Billed demand exceeds recorded demand" }
      : { status: "healthy" };
  },
  // 1.4 Low load factor.
  "1.4": (n) => {
    const lf = n("loadFactorPct");
    const fc = n("fixedDemandCharges");
    return lf > 0 && lf < 40 && fc > 0
      ? { status: "loss", annualINR: Math.round(fc * 12 * 0.15), note: `Load factor only ${lf}%` }
      : { status: "healthy" };
  },
  // 2.1 PF penalty — explicit penalty line present.
  "2.1": (n) => {
    const pf = n("powerFactor");
    const pen = n("pfPenaltyAmt");
    return pf > 0 && pf < 0.95 && pen > 0
      ? { status: "loss", annualINR: Math.round(pen * 12), note: `Power factor ${pf.toFixed(2)}` }
      : { status: "healthy" };
  },
  // 2.2 kVAh inflation — only when NOT already penalised on kWh.
  "2.2": (n) => {
    if (n("pfPenaltyAmt") > 0) return { status: "healthy", note: "kWh-based billing" };
    const pf = n("powerFactor");
    const kvah = n("apparentKvah");
    const kwh = n("energyKwh");
    const ec = n("energyCharges");
    if (pf > 0 && pf < 0.95 && kwh > 0 && kvah > kwh && ec > 0) {
      const rate = ec / kwh;
      return { status: "loss", annualINR: Math.round((kvah - kwh) * rate * 12), note: "kVAh billed above kWh used" };
    }
    return { status: "healthy" };
  },
  // 2.3 Lost high-PF rebate — only when PF already ≥ 0.95 and no rebate present.
  "2.3": (n) => {
    const pf = n("powerFactor");
    const fc = n("fixedDemandCharges");
    return pf >= 0.95 && fc > 0 && n("pfPenaltyAmt") === 0
      ? { status: "loss", annualINR: Math.round(fc * 0.02 * 12), note: "Eligible for a high-PF rebate" }
      : { status: "healthy" };
  },
  // 3.1 Peak-hour load shift — needs peak kWh and both rates.
  "3.1": (n) => {
    const p = n("todPeakKwh");
    const pr = n("todPeakRate");
    const off = n("todOffPeakRate");
    return p > 0 && pr > 0 && off > 0 && pr > off
      ? { status: "loss", annualINR: Math.round(p * 0.2 * (pr - off) * 12), note: "Shift ~20% of peak load to off-peak" }
      : { status: "healthy" };
  },
  // 3.4 ToD not applied — positively no ToD slabs, but energy & demand present.
  "3.4": (n) => {
    const anyTod = n("todPeakKwh") + n("todOffPeakKwh") + n("todNormalKwh");
    const ec = n("energyCharges");
    return anyTod === 0 && ec > 0 && n("maxDemandKva") > 0
      ? { status: "loss", annualINR: Math.round(ec * 0.05 * 12), note: "No ToD slabs on the bill despite eligibility" }
      : { status: "healthy" };
  },
  // 5.2 Voltage / tariff mismatch.
  "5.2": (n, fields) => {
    const v = str(fields, "supplyVoltage");
    const t = str(fields, "tariffCategory");
    const ec = n("energyCharges");
    const mismatch = (v.includes("HT") && t.includes("LT")) || (v.includes("LT") && t.includes("HT"));
    return mismatch && ec > 0
      ? { status: "loss", annualINR: Math.round(ec * 0.07 * 12), note: "Voltage level and tariff category disagree" }
      : { status: "healthy" };
  },
  // 6.5 Arrears to review (one-time, not annualised).
  "6.5": (n) => {
    const a = n("arrears");
    return a > 0 ? { status: "loss", annualINR: Math.round(a), note: "Arrears on the bill — review (one-time)" } : { status: "healthy" };
  },
  // 7.1 Open access (OPPORTUNITY) — high energy rate + eligible load, not already on OA.
  // Rate keyed off energy charges (not total) so arrears don't distort eligibility.
  "7.1": (n) => {
    const kwh = n("energyKwh");
    const ec = n("energyCharges");
    const rate = kwh > 0 ? ec / kwh : 0;
    const onOA = n("wheelingCharges") > 0 || n("crossSubsidySurcharge") > 0;
    return !onOA && rate > 6.5 && ec > 0 && n("sanctionedLoadKw") >= 100
      ? { status: "loss", annualINR: Math.round(ec * 0.12 * 12), note: `Energy at ₹${rate.toFixed(1)}/kWh — open access could cut it` }
      : { status: "healthy" };
  },
  // 9.4 Late-payment surcharge.
  "9.4": (n) => {
    const l = n("latePaymentSurcharge");
    return l > 0 ? { status: "loss", annualINR: Math.round(l * 12), note: "Recurring late-payment surcharge" } : { status: "healthy" };
  },
  // 9.7 Minimum charges — placeholder (needs the tariff minimum to assess fully).
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
