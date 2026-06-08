/**
 * The complete electricity-bill loss taxonomy: 58 distinct checks across 10
 * categories. Each check declares what extra data it needs beyond a single
 * bill's 42 fields (empty `needs` = assessable from the bill alone).
 *
 * The diagnosis engine (lib/diagnosis.ts) runs every check and returns, for
 * each, either a ₹ figure, "healthy/not applicable", or "needs more data".
 */

export type DataNeed =
  | "interval15min"
  | "submetering"
  | "buildingProfile"
  | "fuelBills"
  | "tariffOrder"
  | "history12mo"
  | "powerAnalyser"
  | "openAccessStatus"
  | "portfolio"
  | "records";

export const DATA_NEED_LABELS: Record<DataNeed, string> = {
  interval15min: "15-minute interval data",
  submetering: "sub-meter readings",
  buildingProfile: "building profile (area, roof, occupancy)",
  fuelBills: "DG / diesel fuel bills",
  tariffOrder: "the DISCOM tariff order",
  history12mo: "12 months of bills",
  powerAnalyser: "a power-quality survey",
  openAccessStatus: "open-access feasibility inputs",
  portfolio: "multi-site portfolio data",
  records: "metering / connection records",
};

export type LossCheck = {
  id: string;
  category: number;
  name: string;
  needs: DataNeed[];
  fix: string;
};

export const CATEGORIES: { n: number; name: string }[] = [
  { n: 1, name: "Demand-related" },
  { n: 2, name: "Power factor" },
  { n: 3, name: "Time-of-day" },
  { n: 4, name: "Power quality & harmonics" },
  { n: 5, name: "Tariff & classification" },
  { n: 6, name: "Metering & billing errors" },
  { n: 7, name: "Procurement opportunities" },
  { n: 8, name: "Infrastructure & technical" },
  { n: 9, name: "Surcharge, tax & regulatory" },
  { n: 10, name: "Operational (data-derived)" },
];

export function categoryName(n: number): string {
  return CATEGORIES.find((c) => c.n === n)?.name ?? `Category ${n}`;
}

export const LOSS_CHECKS: LossCheck[] = [
  // 1. Demand-related
  { id: "1.1", category: 1, name: "Contract demand over-sized", needs: [], fix: "Apply for a lower contract demand" },
  { id: "1.2", category: 1, name: "Demand exceeded contract (penalty)", needs: [], fix: "Maximum-demand controller / peak shaving" },
  { id: "1.3", category: 1, name: "Demand ratchet / billed above actual", needs: [], fix: "Manage peaks; request ratchet reset" },
  { id: "1.4", category: 1, name: "Low load factor", needs: [], fix: "Stagger loads, shift production" },
  { id: "1.5", category: 1, name: "Demand during non-working hours", needs: ["interval15min"], fix: "Scheduling, occupancy controls" },
  // 2. Power factor
  { id: "2.1", category: 2, name: "Power-factor penalty", needs: [], fix: "Install an APFC panel" },
  { id: "2.2", category: 2, name: "kVAh billing inflation", needs: [], fix: "APFC + PF monitoring" },
  { id: "2.3", category: 2, name: "Lost PF rebate / incentive", needs: [], fix: "Push PF above the incentive threshold" },
  { id: "2.4", category: 2, name: "Leading power-factor penalty", needs: ["powerAnalyser"], fix: "Automatic-switching APFC" },
  { id: "2.5", category: 2, name: "Reactive-energy charges", needs: ["tariffOrder"], fix: "PF correction + harmonic filtering" },
  // 3. Time-of-day
  { id: "3.1", category: 3, name: "Peak-hour consumption overload", needs: [], fix: "Shift load to off-peak / solar hours" },
  { id: "3.2", category: 3, name: "Solar-hour under-utilisation", needs: ["buildingProfile"], fix: "Shift operations to solar hours" },
  { id: "3.3", category: 3, name: "Night / off-peak waste", needs: ["interval15min"], fix: "Auto-scheduling, occupancy controls" },
  { id: "3.4", category: 3, name: "ToD tariff not applied", needs: [], fix: "Request a ToD / smart meter" },
  // 4. Power quality & harmonics
  { id: "4.1", category: 4, name: "Harmonics-induced kVAh inflation", needs: ["powerAnalyser"], fix: "Active harmonic filter / detuned reactor" },
  { id: "4.2", category: 4, name: "Voltage-unbalance losses", needs: ["powerAnalyser"], fix: "Phase balancing" },
  { id: "4.3", category: 4, name: "Neutral-current losses", needs: ["powerAnalyser"], fix: "3rd-harmonic filter, oversized neutral" },
  { id: "4.4", category: 4, name: "Voltage sag/swell equipment losses", needs: ["powerAnalyser"], fix: "Voltage stabiliser / DVR" },
  { id: "4.5", category: 4, name: "Capacitor failure from harmonics", needs: ["records"], fix: "Detuned reactors / active filters" },
  // 5. Tariff & classification
  { id: "5.1", category: 5, name: "Wrong tariff category", needs: ["buildingProfile"], fix: "Apply for category correction" },
  { id: "5.2", category: 5, name: "Wrong voltage-level tariff", needs: [], fix: "Correct voltage classification" },
  { id: "5.3", category: 5, name: "Slab / tier miscalculation", needs: ["tariffOrder"], fix: "Recompute against the tariff schedule" },
  { id: "5.4", category: 5, name: "Fuel surcharge (FAC/FPPCA) error", needs: ["tariffOrder"], fix: "Cross-check FAC with the SERC order" },
  { id: "5.5", category: 5, name: "Electricity-duty rate error", needs: ["tariffOrder"], fix: "Verify duty rate against notification" },
  { id: "5.6", category: 5, name: "Missing applicable rebates", needs: [], fix: "Pay before due date; claim rebates" },
  // 6. Metering & billing errors
  { id: "6.1", category: 6, name: "Faulty / fast-running meter", needs: ["history12mo"], fix: "Meter testing; CGRF complaint" },
  { id: "6.2", category: 6, name: "Estimated / average billing", needs: ["records"], fix: "Insist on actual readings" },
  { id: "6.3", category: 6, name: "CT/PT ratio (multiplying-factor) error", needs: ["records"], fix: "Verify CT/PT against install records" },
  { id: "6.4", category: 6, name: "Meter-reading transposition error", needs: ["history12mo"], fix: "Self-read and photograph the meter" },
  { id: "6.5", category: 6, name: "Back-billing / retrospective charges", needs: [], fix: "Challenge under supply-code limits" },
  { id: "6.6", category: 6, name: "Duplicate charges", needs: ["history12mo"], fix: "Line-by-line bill audit" },
  { id: "6.7", category: 6, name: "Wrong consumer / cross-connection", needs: ["records"], fix: "Physical meter verification" },
  // 7. Procurement opportunities
  { id: "7.1", category: 7, name: "Not using open access", needs: [], fix: "Open-access feasibility & application" },
  { id: "7.2", category: 7, name: "No solar rooftop", needs: ["buildingProfile"], fix: "Solar feasibility → PPA / CAPEX" },
  { id: "7.3", category: 7, name: "No BESS / peak shaving", needs: ["interval15min"], fix: "Battery sizing from load profile" },
  { id: "7.4", category: 7, name: "Not in group captive", needs: ["openAccessStatus"], fix: "Group-captive SPV" },
  { id: "7.5", category: 7, name: "Not in demand response", needs: ["submetering"], fix: "Enrol flexible loads in DR" },
  { id: "7.6", category: 7, name: "No electricity hedging", needs: ["openAccessStatus"], fix: "Futures for price lock-in" },
  // 8. Infrastructure & technical
  { id: "8.1", category: 8, name: "Transformer no-load (iron) losses", needs: ["interval15min"], fix: "Right-size / amorphous core" },
  { id: "8.2", category: 8, name: "Transformer copper losses", needs: ["submetering"], fix: "Right-size; improve PF" },
  { id: "8.3", category: 8, name: "Cable / distribution losses", needs: ["submetering"], fix: "Cable upgrades, shorter runs" },
  { id: "8.4", category: 8, name: "DG-set inefficiency", needs: ["fuelBills"], fix: "Minimise runtime; BESS backup" },
  { id: "8.5", category: 8, name: "UPS conversion losses", needs: ["submetering"], fix: "High-efficiency UPS, eco-mode" },
  // 9. Surcharge, tax & regulatory
  { id: "9.1", category: 9, name: "Cross-subsidy surcharge overcharge", needs: ["openAccessStatus"], fix: "Claim RE/captive exemption" },
  { id: "9.2", category: 9, name: "Additional surcharge incorrectly applied", needs: ["openAccessStatus"], fix: "Challenge with SERC order" },
  { id: "9.3", category: 9, name: "Wheeling / transmission charge error", needs: ["openAccessStatus"], fix: "Verify against tariff order" },
  { id: "9.4", category: 9, name: "Late-payment surcharge (avoidable)", needs: [], fix: "Auto-pay before due date" },
  { id: "9.5", category: 9, name: "Security-deposit excess", needs: ["records"], fix: "Apply for refund of excess" },
  { id: "9.6", category: 9, name: "RPO / RCO non-compliance", needs: ["tariffOrder"], fix: "Buy RECs or RE power" },
  { id: "9.7", category: 9, name: "Minimum charges overriding actual", needs: [], fix: "Right-size the connection" },
  // 10. Operational (data-derived)
  { id: "10.1", category: 10, name: "Seasonal demand mismatch", needs: ["history12mo"], fix: "Seasonal CD revision / BESS" },
  { id: "10.2", category: 10, name: "Coincidence-factor loss", needs: ["portfolio"], fix: "Portfolio demand management" },
  { id: "10.3", category: 10, name: "Base-load creep", needs: ["history12mo"], fix: "Audit phantom loads" },
  { id: "10.4", category: 10, name: "Weekend / holiday consumption", needs: ["interval15min"], fix: "Scheduling, auto-shutdown" },
  { id: "10.5", category: 10, name: "HVAC over-cooling / heating", needs: ["interval15min"], fix: "BMS setpoint optimisation" },
  { id: "10.6", category: 10, name: "Lighting waste", needs: ["submetering"], fix: "Occupancy / daylight controls" },
  { id: "10.7", category: 10, name: "Motor over-sizing", needs: ["submetering"], fix: "Right-size; install VFDs" },
  { id: "10.8", category: 10, name: "Tariff escalation creep", needs: ["history12mo"], fix: "Annual tariff audit" },
];

export const TOTAL_CHECKS = LOSS_CHECKS.length; // 58
