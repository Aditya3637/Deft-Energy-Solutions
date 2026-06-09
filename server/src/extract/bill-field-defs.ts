/**
 * Server-side mirror of the 42 bill-field definitions (key → label / group /
 * unit / hint). Lets POST /v1/extract return the exact `ExtractedField` shape
 * the frontend review screen renders, and gives the vision model a compact,
 * unambiguous reference for what each key means on an Indian electricity bill.
 *
 * Keep keys 1:1 with CreateBillDto and lib/mock/bill.ts.
 */

export type FieldGroup =
  | "Identity"
  | "Supply & demand"
  | "Energy"
  | "Charges"
  | "Time-of-day"
  | "Taxes & adjustments"
  | "Meter & dates";

export type FieldKind = "string" | "number";

export type FieldDef = {
  key: string;
  label: string;
  group: FieldGroup;
  kind: FieldKind;
  unit?: string;
  /** One-line meaning shown to the model so it maps DISCOM-specific labels. */
  hint: string;
};

export const FIELD_DEFS: FieldDef[] = [
  // Identity
  { key: "consumerNumber", label: "Consumer number", group: "Identity", kind: "string", hint: "Consumer / service / account number (a.k.a. BU-Consumer No)." },
  { key: "consumerName", label: "Consumer name", group: "Identity", kind: "string", hint: "Registered consumer / firm name." },
  { key: "address", label: "Address", group: "Identity", kind: "string", hint: "Service / installation address." },
  { key: "discom", label: "DISCOM", group: "Identity", kind: "string", hint: "Utility name, e.g. MSEDCL, BESCOM, TANGEDCO, TPDDL, Adani, Torrent." },
  // Supply & demand
  { key: "tariffCategory", label: "Tariff category", group: "Supply & demand", kind: "string", hint: "Tariff / rate category, e.g. HT-I Industrial, LT-II Commercial." },
  { key: "supplyVoltage", label: "Supply voltage", group: "Supply & demand", kind: "string", hint: "Supply / connection voltage, e.g. LT 415V, HT 11kV / 22kV / 33kV." },
  { key: "sanctionedLoadKw", label: "Sanctioned load", group: "Supply & demand", kind: "number", unit: "kW", hint: "Sanctioned / connected load in kW." },
  { key: "contractDemandKva", label: "Contract demand", group: "Supply & demand", kind: "number", unit: "kVA", hint: "Contract demand in kVA (sometimes kW)." },
  { key: "billingDemandKva", label: "Billing demand", group: "Supply & demand", kind: "number", unit: "kVA", hint: "Billing demand used to compute demand charges, in kVA." },
  { key: "maxDemandKva", label: "Maximum demand recorded", group: "Supply & demand", kind: "number", unit: "kVA", hint: "Maximum / recorded demand (MD) this period, in kVA." },
  { key: "mdDateTime", label: "MD date & time", group: "Supply & demand", kind: "string", hint: "Date & time the maximum demand occurred." },
  // Energy
  { key: "energyKwh", label: "Energy consumed", group: "Energy", kind: "number", unit: "kWh", hint: "Active energy / units consumed this period, in kWh." },
  { key: "reactiveKvarh", label: "Reactive energy", group: "Energy", kind: "number", unit: "kVARh", hint: "Reactive energy in kVARh." },
  { key: "apparentKvah", label: "Apparent energy", group: "Energy", kind: "number", unit: "kVAh", hint: "Apparent energy in kVAh (kVAh-based billing)." },
  { key: "powerFactor", label: "Power factor (avg)", group: "Energy", kind: "number", hint: "Average power factor (0–1), or % (96 means 0.96)." },
  { key: "loadFactorPct", label: "Load factor", group: "Energy", kind: "number", unit: "%", hint: "Load factor as a percentage." },
  // Charges
  { key: "fixedDemandCharges", label: "Fixed / demand charges", group: "Charges", kind: "number", unit: "₹", hint: "Fixed / demand charges amount in ₹." },
  { key: "energyCharges", label: "Energy charges", group: "Charges", kind: "number", unit: "₹", hint: "Energy / consumption charges amount in ₹." },
  { key: "wheelingCharges", label: "Wheeling charges", group: "Charges", kind: "number", unit: "₹", hint: "Wheeling charges amount in ₹." },
  { key: "crossSubsidySurcharge", label: "Cross-subsidy surcharge", group: "Charges", kind: "number", unit: "₹", hint: "Cross-subsidy surcharge (CSS) amount in ₹ (open-access)." },
  { key: "additionalSurcharge", label: "Additional surcharge", group: "Charges", kind: "number", unit: "₹", hint: "Additional surcharge amount in ₹ (open-access)." },
  { key: "pfPenaltyAmt", label: "PF incentive / penalty", group: "Charges", kind: "number", unit: "₹", hint: "Power-factor penalty (+) or incentive (−) amount in ₹." },
  { key: "pfPenaltyRatePct", label: "PF incentive / penalty rate", group: "Charges", kind: "number", unit: "%", hint: "Power-factor penalty / incentive rate as a percentage." },
  // Time-of-day
  { key: "todPeakKwh", label: "ToD peak", group: "Time-of-day", kind: "number", unit: "kWh", hint: "Time-of-day peak-zone energy in kWh." },
  { key: "todOffPeakKwh", label: "ToD off-peak", group: "Time-of-day", kind: "number", unit: "kWh", hint: "Time-of-day off-peak / night-zone energy in kWh." },
  { key: "todNormalKwh", label: "ToD normal / shoulder", group: "Time-of-day", kind: "number", unit: "kWh", hint: "Time-of-day normal / shoulder-zone energy in kWh." },
  { key: "todPeakRate", label: "ToD peak rate", group: "Time-of-day", kind: "number", unit: "₹/kWh", hint: "Peak-zone tariff in ₹/kWh." },
  { key: "todOffPeakRate", label: "ToD off-peak rate", group: "Time-of-day", kind: "number", unit: "₹/kWh", hint: "Off-peak-zone tariff in ₹/kWh." },
  { key: "todShoulderRate", label: "ToD shoulder rate", group: "Time-of-day", kind: "number", unit: "₹/kWh", hint: "Shoulder/normal-zone tariff in ₹/kWh." },
  // Taxes & adjustments
  { key: "facFppca", label: "Fuel adjustment (FAC / FPPCA)", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Fuel adjustment charge FAC / FPPCA / FAC-true-up in ₹." },
  { key: "electricityDuty", label: "Electricity duty / tax", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Electricity duty / tax on sale of electricity in ₹." },
  { key: "meterRent", label: "Meter rent", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Meter rent / service charge in ₹." },
  { key: "transformerLossPct", label: "Transformer loss loading", group: "Taxes & adjustments", kind: "number", unit: "%", hint: "Transformer / line loss loading as a percentage." },
  { key: "arrears", label: "Arrears", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Arrears / previous outstanding in ₹." },
  { key: "latePaymentSurcharge", label: "Late payment surcharge", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Late payment surcharge / DPC in ₹." },
  { key: "earlyPaymentRebate", label: "Early payment rebate", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Prompt / early-payment rebate in ₹ (report as a positive number)." },
  { key: "netMeteringCredit", label: "Net metering credit", group: "Taxes & adjustments", kind: "number", unit: "₹", hint: "Net-metering / solar export credit in ₹." },
  // Meter & dates
  { key: "totalAmountDue", label: "Total amount due", group: "Meter & dates", kind: "number", unit: "₹", hint: "Net amount payable (current bill) in ₹." },
  { key: "billDate", label: "Bill date", group: "Meter & dates", kind: "string", hint: "Bill / invoice date (DD-MM-YYYY)." },
  { key: "dueDate", label: "Due date", group: "Meter & dates", kind: "string", hint: "Payment due date (DD-MM-YYYY)." },
  { key: "billingPeriodDays", label: "Billing period", group: "Meter & dates", kind: "number", unit: "days", hint: "Number of days in the billing period." },
  { key: "meterNumber", label: "Meter number & multiplying factor", group: "Meter & dates", kind: "string", hint: "Meter serial number (and multiplying factor if shown)." },
];

export const FIELD_KEYS: string[] = FIELD_DEFS.map((f) => f.key);
const DEF_BY_KEY: Record<string, FieldDef> = Object.fromEntries(
  FIELD_DEFS.map((f) => [f.key, f] as const),
);

export function defForKey(key: string): FieldDef | undefined {
  return DEF_BY_KEY[key];
}

/** Compact `key — Label (unit): hint` reference block for the model prompt. */
export function fieldReferenceText(): string {
  return FIELD_DEFS.map((f) => {
    const u = f.unit ? ` (${f.unit})` : "";
    return `- ${f.key} — ${f.label}${u}: ${f.hint}`;
  }).join("\n");
}
