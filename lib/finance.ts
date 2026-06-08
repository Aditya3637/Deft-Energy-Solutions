/** Pure financial helpers for the ROI calculator (E12). No side effects. */

export type RoiInput = {
  capex: number;
  annualSaving: number;
  years: number;
  discountRatePct: number;
  escalationPct: number;
};

export type RoiResult = {
  /** Simple payback in years (escalation ignored), or null if no saving. */
  paybackYears: number | null;
  /** Net present value over the project life, ₹. */
  npv: number;
  /** Internal rate of return, %, or null if undefined (e.g. zero capex). */
  irrPct: number | null;
  /** Total undiscounted savings over the project life, ₹. */
  lifetimeSavings: number;
};

function npvAt(i: RoiInput, rate: number): number {
  const g = i.escalationPct / 100;
  let v = -i.capex;
  for (let t = 1; t <= i.years; t++) {
    const saving = i.annualSaving * Math.pow(1 + g, t - 1);
    v += saving / Math.pow(1 + rate, t);
  }
  return v;
}

function irr(i: RoiInput): number | null {
  if (i.capex <= 0 || i.annualSaving <= 0) return null;
  let lo = -0.9;
  let hi = 5;
  let flo = npvAt(i, lo);
  let fhi = npvAt(i, hi);
  if (flo * fhi > 0) return null; // no sign change → no root in range
  let mid = lo;
  for (let k = 0; k < 60; k++) {
    mid = (lo + hi) / 2;
    const fm = npvAt(i, mid);
    if (Math.abs(fm) < 1) break;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return mid * 100;
}

export function computeRoi(i: RoiInput): RoiResult {
  const g = i.escalationPct / 100;
  let lifetimeSavings = 0;
  for (let t = 1; t <= i.years; t++) {
    lifetimeSavings += i.annualSaving * Math.pow(1 + g, t - 1);
  }
  return {
    paybackYears: i.annualSaving > 0 ? i.capex / i.annualSaving : null,
    npv: npvAt(i, i.discountRatePct / 100),
    irrPct: irr(i),
    lifetimeSavings,
  };
}

/** Recommended retrofit presets surfaced from diagnoses (CAPEX + annual saving, ₹). */
export type EcmPreset = {
  id: string;
  label: string;
  capex: number;
  annualSaving: number;
  note: string;
};

export const ECM_PRESETS: EcmPreset[] = [
  { id: "cd", label: "Contract demand reduction", capex: 25000, annualSaving: 1080000, note: "Acme Bhosari — 1000 → 800 kVA" },
  { id: "apfc", label: "APFC power-factor panel", capex: 450000, annualSaving: 578400, note: "Raise PF to 0.95" },
  { id: "tod", label: "ToD load-shift controls", capex: 300000, annualSaving: 1109000, note: "Shift 20% of peak load" },
  { id: "solar", label: "Rooftop solar 100 kWp", capex: 4500000, annualSaving: 620000, note: "Net-metered generation" },
  { id: "bess", label: "BESS peak shaving", capex: 6000000, annualSaving: 950000, note: "Demand + arbitrage" },
];
