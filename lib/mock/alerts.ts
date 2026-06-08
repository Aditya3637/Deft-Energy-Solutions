/** Mock alert engine (N01–N04): triggered instances + configured rules. Deterministic. */

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "new" | "acknowledged" | "resolved";

export type AlertInstance = {
  id: string;
  title: string;
  building: string;
  detail: string;
  severity: AlertSeverity;
  triggered: string;
  status: AlertStatus;
};

export const ALERTS: AlertInstance[] = [
  { id: "a1", title: "Power factor below 0.90", building: "CoolChain Cold Storage", detail: "PF 0.88 vs 0.90 threshold — penalty accruing", severity: "critical", triggered: "06-06-2026", status: "new" },
  { id: "a2", title: "Maximum demand above 90% of contract", building: "Riverside Mall", detail: "MD 2,300 kVA vs 2,500 kVA contract (92%)", severity: "warning", triggered: "05-06-2026", status: "new" },
  { id: "a3", title: "Bill 23% above forecast", building: "TechPark Block C", detail: "₹36.8L vs ₹29.9L expected for May", severity: "warning", triggered: "04-06-2026", status: "acknowledged" },
  { id: "a4", title: "EPI above benchmark", building: "CoolChain Cold Storage", detail: "28.4 kWh/ft² vs 18 benchmark for cold storage", severity: "warning", triggered: "02-06-2026", status: "acknowledged" },
  { id: "a5", title: "Bill not received", building: "Riverside Mall", detail: "May 2026 bill missing past due date", severity: "info", triggered: "03-06-2026", status: "new" },
  { id: "a6", title: "Meter offline", building: "Orchid Tower (HQ)", detail: "No reading received for 6 hours", severity: "info", triggered: "01-06-2026", status: "resolved" },
];

export type AlertRule = {
  id: string;
  name: string;
  condition: string;
  severity: AlertSeverity;
  active: boolean;
};

export const ALERT_RULES: AlertRule[] = [
  { id: "r1", name: "Low power factor", condition: "PF < 0.90", severity: "critical", active: true },
  { id: "r2", name: "Demand near contract", condition: "Max demand > 90% of contract demand", severity: "warning", active: true },
  { id: "r3", name: "Bill anomaly", condition: "Bill > 15% above weather-normalised forecast", severity: "warning", active: true },
  { id: "r4", name: "EPI deviation", condition: "EPI > 10% above peer benchmark", severity: "warning", active: true },
  { id: "r5", name: "Missing bill", condition: "No bill received past due date", severity: "info", active: true },
  { id: "r6", name: "Meter offline", condition: "No reading for > 4 hours", severity: "info", active: false },
];
