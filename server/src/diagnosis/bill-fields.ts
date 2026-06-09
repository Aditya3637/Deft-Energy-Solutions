import type { ElectricityBill } from "@prisma/client";

import type { ExtractedField } from "./engine";

/**
 * The bill columns the engine reads, by key. Column names match the engine's
 * field keys 1:1, so the mapper is a straight projection.
 */
const FIELD_KEYS: (keyof ElectricityBill)[] = [
  "consumerNumber", "consumerName", "address", "discom", "tariffCategory", "supplyVoltage",
  "sanctionedLoadKw", "contractDemandKva", "billingDemandKva", "maxDemandKva", "mdDateTime",
  "energyKwh", "reactiveKvarh", "apparentKvah", "powerFactor", "loadFactorPct",
  "fixedDemandCharges", "energyCharges", "wheelingCharges", "crossSubsidySurcharge", "additionalSurcharge",
  "pfPenaltyAmt", "pfPenaltyRatePct", "todPeakKwh", "todOffPeakKwh", "todNormalKwh", "todPeakRate",
  "todOffPeakRate", "todShoulderRate", "facFppca", "electricityDuty", "meterRent", "transformerLossPct",
  "arrears", "latePaymentSurcharge", "earlyPaymentRebate", "netMeteringCredit", "totalAmountDue",
  "billDate", "dueDate", "billingPeriodDays", "meterNumber",
];

/** Project a persisted bill into the engine's ExtractedField[] shape. */
export function billToFields(bill: ElectricityBill): ExtractedField[] {
  return FIELD_KEYS.map((k) => {
    const v = bill[k];
    return { key: k as string, value: v == null ? "" : String(v) };
  });
}
