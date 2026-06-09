/**
 * Arithmetic sanity checks for an extracted bill — data-quality, not savings.
 * Runs client-side on the review screen and re-evaluates as the user edits, to
 * catch misread digits before diagnosis. Distinct from lib/diagnosis.ts (which
 * finds losses); this only asks "do the numbers on the bill add up?".
 *
 * No-false-positive discipline: every check runs ONLY when its inputs are
 * present, and fires a warning only on a physical impossibility or a large
 * discrepancy. Partial extraction (missing fields) never triggers a warning.
 */

import type { ExtractedField } from "@/lib/mock/bill";

export type CheckStatus = "ok" | "info" | "warn";
export type BillCheck = { id: string; label: string; status: CheckStatus; detail: string };

function num(fields: ExtractedField[], key: string): number | null {
  const f = fields.find((x) => x.key === key);
  if (!f) return null;
  const raw = (f.value ?? "").replace(/[₹,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** DD-MM-YYYY (optionally with time) → Date, or null. */
function parseDate(fields: ExtractedField[], key: string): Date | null {
  const f = fields.find((x) => x.key === key);
  const m = f?.value?.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const CHARGE_KEYS = [
  "fixedDemandCharges", "energyCharges", "wheelingCharges", "crossSubsidySurcharge",
  "additionalSurcharge", "pfPenaltyAmt", "facFppca", "electricityDuty", "meterRent",
  "latePaymentSurcharge", "arrears",
];
const CREDIT_KEYS = ["earlyPaymentRebate", "netMeteringCredit"];

/** Run every applicable check; returns only the checks that could be evaluated. */
export function arithmeticChecks(fields: ExtractedField[]): BillCheck[] {
  const out: BillCheck[] = [];

  // 1. Charge lines vs total amount due. Under-summing is expected (not all
  //    heads are itemised in 42 fields), so we only WARN when the parts exceed
  //    the whole — that's a genuine inconsistency / misread.
  const total = num(fields, "totalAmountDue");
  const energyCh = num(fields, "energyCharges");
  if (total && total > 0 && energyCh != null) {
    const charges = CHARGE_KEYS.reduce((s, k) => s + (num(fields, k) ?? 0), 0);
    const credits = CREDIT_KEYS.reduce((s, k) => s + (num(fields, k) ?? 0), 0);
    const adjusted = charges - credits;
    const ratio = adjusted / total;
    if (adjusted > total * 1.15) {
      out.push({
        id: "components-vs-total",
        label: "Charges vs total",
        status: "warn",
        detail: `Itemised charges (${inr(adjusted)}) exceed the total due (${inr(total)}) — likely a misread digit. Check the big amounts.`,
      });
    } else if (ratio >= 0.9 && ratio <= 1.1) {
      out.push({
        id: "components-vs-total",
        label: "Charges vs total",
        status: "ok",
        detail: `Charge lines add up to the total (${inr(adjusted)} vs ${inr(total)}).`,
      });
    } else {
      out.push({
        id: "components-vs-total",
        label: "Charges vs total",
        status: "info",
        detail: `Charge lines sum to ${inr(adjusted)} vs total ${inr(total)} — fine if some heads (taxes/other) aren't itemised here.`,
      });
    }
  }

  // 2. Apparent energy (kVAh) must be >= active energy (kWh).
  const kwh = num(fields, "energyKwh");
  const kvah = num(fields, "apparentKvah");
  if (kwh != null && kvah != null && kwh > 0 && kvah > 0) {
    if (kvah < kwh * 0.98) {
      out.push({
        id: "apparent-vs-active",
        label: "Apparent vs active energy",
        status: "warn",
        detail: `Apparent energy (${Math.round(kvah).toLocaleString("en-IN")} kVAh) is below active energy (${Math.round(kwh).toLocaleString("en-IN")} kWh), which isn't possible — recheck both.`,
      });
    } else {
      out.push({
        id: "apparent-vs-active",
        label: "Apparent vs active energy",
        status: "ok",
        detail: "Apparent energy is at or above active energy, as expected.",
      });
    }
  }

  // 3. Power factor sanity — range, and consistency with kWh/kVAh.
  const pf = num(fields, "powerFactor");
  if (pf != null) {
    if (pf <= 0 || pf > 1) {
      out.push({
        id: "pf-range",
        label: "Power factor range",
        status: "warn",
        detail: `Power factor should be 0–1; "${fields.find((f) => f.key === "powerFactor")?.value}" looks like a percentage (e.g. 0.96, not 96).`,
      });
    } else if (kwh != null && kvah != null && kvah > 0) {
      const implied = Math.min(1, kwh / kvah);
      if (Math.abs(implied - pf) > 0.07) {
        out.push({
          id: "pf-consistency",
          label: "Power factor vs energy",
          status: "warn",
          detail: `Stated PF (${pf}) doesn't match kWh/kVAh (≈${implied.toFixed(2)}) — verify the PF or the energy figures.`,
        });
      } else {
        out.push({
          id: "pf-consistency",
          label: "Power factor vs energy",
          status: "ok",
          detail: `Stated PF (${pf}) matches kWh/kVAh (≈${implied.toFixed(2)}).`,
        });
      }
    }
  }

  // 4. ToD zones should sum to total energy (only when all three present).
  const peak = num(fields, "todPeakKwh");
  const off = num(fields, "todOffPeakKwh");
  const normal = num(fields, "todNormalKwh");
  if (kwh != null && kwh > 0 && peak != null && off != null && normal != null) {
    const sum = peak + off + normal;
    if (Math.abs(sum - kwh) / kwh > 0.05) {
      out.push({
        id: "tod-vs-energy",
        label: "Time-of-day split",
        status: "warn",
        detail: `ToD zones sum to ${Math.round(sum).toLocaleString("en-IN")} kWh vs total ${Math.round(kwh).toLocaleString("en-IN")} kWh — they should match.`,
      });
    } else {
      out.push({
        id: "tod-vs-energy",
        label: "Time-of-day split",
        status: "ok",
        detail: "Time-of-day zones add up to total energy.",
      });
    }
  }

  // 5. Recorded / billing demand vs contract demand (exceedance flag).
  const contract = num(fields, "contractDemandKva");
  const recorded = num(fields, "maxDemandKva") ?? num(fields, "billingDemandKva");
  if (contract != null && contract > 0 && recorded != null && recorded > contract * 1.02) {
    out.push({
      id: "demand-exceedance",
      label: "Demand vs contract",
      status: "info",
      detail: `Recorded demand (${Math.round(recorded).toLocaleString("en-IN")} kVA) exceeds contract demand (${Math.round(contract).toLocaleString("en-IN")} kVA) — verify; genuine exceedance attracts a penalty.`,
    });
  }

  // 6. Due date should not precede bill date.
  const billDate = parseDate(fields, "billDate");
  const dueDate = parseDate(fields, "dueDate");
  if (billDate && dueDate && dueDate.getTime() < billDate.getTime()) {
    out.push({
      id: "date-order",
      label: "Bill & due dates",
      status: "warn",
      detail: "Due date is before the bill date — check the dates.",
    });
  }

  // 7. Billing period plausibility.
  const days = num(fields, "billingPeriodDays");
  if (days != null && (days < 20 || days > 40)) {
    out.push({
      id: "billing-period",
      label: "Billing period",
      status: "info",
      detail: `Billing period of ${days} days is unusual (typically 28–31) — verify.`,
    });
  }

  return out;
}
