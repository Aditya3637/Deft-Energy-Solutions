/**
 * Mock bill data + diagnosis engine for Stage B1 (the core loop).
 * This is the seed of the future mock-API seam: screens read from here today,
 * and Stage F swaps the implementation for real OCR + diagnostics behind the
 * same shapes. All numbers are illustrative.
 */

export type FieldGroup =
  | "Identity"
  | "Supply & demand"
  | "Energy"
  | "Charges"
  | "Time-of-day"
  | "Taxes & adjustments"
  | "Meter & dates";

export type ExtractedField = {
  key: string;
  label: string;
  group: FieldGroup;
  unit?: string;
  value: string;
  /** OCR confidence 0..1; < 0.8 is flagged for review. */
  confidence: number;
};

export const GROUP_ORDER: FieldGroup[] = [
  "Identity",
  "Supply & demand",
  "Energy",
  "Charges",
  "Time-of-day",
  "Taxes & adjustments",
  "Meter & dates",
];

/** A realistic MSEDCL HT-I industrial bill — all 42 spec fields. */
export const SAMPLE_FIELDS: ExtractedField[] = [
  // Identity
  { key: "consumerNumber", label: "Consumer number", group: "Identity", value: "0123456789", confidence: 0.99 },
  { key: "consumerName", label: "Consumer name", group: "Identity", value: "Acme Manufacturing Pvt Ltd", confidence: 0.97 },
  { key: "address", label: "Address", group: "Identity", value: "Plot 14, MIDC Bhosari, Pune 411026", confidence: 0.88 },
  { key: "discom", label: "DISCOM", group: "Identity", value: "MSEDCL", confidence: 0.99 },
  // Supply & demand
  { key: "tariffCategory", label: "Tariff category", group: "Supply & demand", value: "HT-I (Industrial)", confidence: 0.95 },
  { key: "supplyVoltage", label: "Supply voltage", group: "Supply & demand", value: "HT (22 kV)", confidence: 0.94 },
  { key: "sanctionedLoadKw", label: "Sanctioned load", group: "Supply & demand", unit: "kW", value: "850", confidence: 0.92 },
  { key: "contractDemandKva", label: "Contract demand", group: "Supply & demand", unit: "kVA", value: "1000", confidence: 0.96 },
  { key: "billingDemandKva", label: "Billing demand", group: "Supply & demand", unit: "kVA", value: "750", confidence: 0.9 },
  { key: "maxDemandKva", label: "Maximum demand recorded", group: "Supply & demand", unit: "kVA", value: "720", confidence: 0.93 },
  { key: "mdDateTime", label: "MD date & time", group: "Supply & demand", value: "18-05-2026 15:30", confidence: 0.71 },
  // Energy
  { key: "energyKwh", label: "Energy consumed", group: "Energy", unit: "kWh", value: "428000", confidence: 0.98 },
  { key: "reactiveKvarh", label: "Reactive energy", group: "Energy", unit: "kVARh", value: "195000", confidence: 0.85 },
  { key: "apparentKvah", label: "Apparent energy", group: "Energy", unit: "kVAh", value: "470300", confidence: 0.84 },
  { key: "powerFactor", label: "Power factor (avg)", group: "Energy", value: "0.91", confidence: 0.95 },
  { key: "loadFactorPct", label: "Load factor", group: "Energy", unit: "%", value: "62", confidence: 0.8 },
  // Charges
  { key: "fixedDemandCharges", label: "Fixed / demand charges", group: "Charges", unit: "₹", value: "337500", confidence: 0.94 },
  { key: "energyCharges", label: "Energy charges", group: "Charges", unit: "₹", value: "3255000", confidence: 0.96 },
  { key: "wheelingCharges", label: "Wheeling charges", group: "Charges", unit: "₹", value: "0", confidence: 0.9 },
  { key: "crossSubsidySurcharge", label: "Cross-subsidy surcharge", group: "Charges", unit: "₹", value: "0", confidence: 0.9 },
  { key: "additionalSurcharge", label: "Additional surcharge", group: "Charges", unit: "₹", value: "0", confidence: 0.9 },
  { key: "pfPenaltyAmt", label: "PF incentive / penalty", group: "Charges", unit: "₹", value: "48200", confidence: 0.78 },
  { key: "pfPenaltyRatePct", label: "PF incentive / penalty rate", group: "Charges", unit: "%", value: "1.5", confidence: 0.75 },
  // Time-of-day
  { key: "todPeakKwh", label: "ToD peak", group: "Time-of-day", unit: "kWh", value: "128400", confidence: 0.86 },
  { key: "todOffPeakKwh", label: "ToD off-peak", group: "Time-of-day", unit: "kWh", value: "171200", confidence: 0.86 },
  { key: "todNormalKwh", label: "ToD normal / shoulder", group: "Time-of-day", unit: "kWh", value: "128400", confidence: 0.83 },
  { key: "todPeakRate", label: "ToD peak rate", group: "Time-of-day", unit: "₹/kWh", value: "9.5", confidence: 0.88 },
  { key: "todOffPeakRate", label: "ToD off-peak rate", group: "Time-of-day", unit: "₹/kWh", value: "5.9", confidence: 0.88 },
  { key: "todShoulderRate", label: "ToD shoulder rate", group: "Time-of-day", unit: "₹/kWh", value: "7.6", confidence: 0.82 },
  // Taxes & adjustments
  { key: "facFppca", label: "Fuel adjustment (FAC / FPPCA)", group: "Taxes & adjustments", unit: "₹", value: "214000", confidence: 0.8 },
  { key: "electricityDuty", label: "Electricity duty / tax", group: "Taxes & adjustments", unit: "₹", value: "312480", confidence: 0.9 },
  { key: "meterRent", label: "Meter rent", group: "Taxes & adjustments", unit: "₹", value: "350", confidence: 0.92 },
  { key: "transformerLossPct", label: "Transformer loss loading", group: "Taxes & adjustments", unit: "%", value: "3", confidence: 0.76 },
  { key: "arrears", label: "Arrears", group: "Taxes & adjustments", unit: "₹", value: "0", confidence: 0.95 },
  { key: "latePaymentSurcharge", label: "Late payment surcharge", group: "Taxes & adjustments", unit: "₹", value: "0", confidence: 0.95 },
  { key: "earlyPaymentRebate", label: "Early payment rebate", group: "Taxes & adjustments", unit: "₹", value: "0", confidence: 0.9 },
  { key: "netMeteringCredit", label: "Net metering credit", group: "Taxes & adjustments", unit: "₹", value: "0", confidence: 0.9 },
  // Meter & dates
  { key: "totalAmountDue", label: "Total amount due", group: "Meter & dates", unit: "₹", value: "4484210", confidence: 0.97 },
  { key: "billDate", label: "Bill date", group: "Meter & dates", value: "02-06-2026", confidence: 0.96 },
  { key: "dueDate", label: "Due date", group: "Meter & dates", value: "17-06-2026", confidence: 0.94 },
  { key: "billingPeriodDays", label: "Billing period", group: "Meter & dates", unit: "days", value: "31", confidence: 0.91 },
  { key: "meterNumber", label: "Meter number & multiplying factor", group: "Meter & dates", value: "MH29-7741203 (MF 1)", confidence: 0.79 },
];

// The diagnosis engine now lives in lib/diagnosis.ts (the full 58-check
// taxonomy). This module only provides the sample bill + field definitions.
