/** Mock data for field roles (Stage B4): work orders, on-site audit, collection. Deterministic. */

/* ----------------------------------------------------------- Work orders */

export type WoStatus = "open" | "in_progress" | "done";
export type WoType = "Preventive" | "Breakdown" | "Inspection";
export type WoPriority = "high" | "medium" | "low";

export type ChecklistItem = { id: string; label: string; done: boolean };

export type WorkOrder = {
  id: string;
  title: string;
  asset: string;
  building: string;
  type: WoType;
  priority: WoPriority;
  due: string;
  status: WoStatus;
  checklist: ChecklistItem[];
};

export const WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo-1042",
    title: "Chiller-1 preventive service",
    asset: "Chiller-1 (350 TR)",
    building: "Acme Bhosari Plant",
    type: "Preventive",
    priority: "high",
    due: "09-06-2026",
    status: "open",
    checklist: [
      { id: "c1", label: "Check refrigerant pressure", done: false },
      { id: "c2", label: "Clean condenser coils", done: false },
      { id: "c3", label: "Inspect compressor & oil level", done: false },
      { id: "c4", label: "Log amps & voltage on all phases", done: false },
      { id: "c5", label: "Verify chilled-water temperature", done: false },
    ],
  },
  {
    id: "wo-1043",
    title: "APFC panel inspection",
    asset: "APFC panel (300 kVAR)",
    building: "CoolChain Cold Storage",
    type: "Inspection",
    priority: "high",
    due: "10-06-2026",
    status: "open",
    checklist: [
      { id: "c1", label: "Check capacitor bank health", done: false },
      { id: "c2", label: "Verify power-factor reading", done: false },
      { id: "c3", label: "Inspect contactors for pitting", done: false },
      { id: "c4", label: "Tighten all connections", done: false },
    ],
  },
  {
    id: "wo-1044",
    title: "AHU-3 belt replacement",
    asset: "AHU-3",
    building: "Orchid Tower (HQ)",
    type: "Breakdown",
    priority: "medium",
    due: "08-06-2026",
    status: "in_progress",
    checklist: [
      { id: "c1", label: "Isolate power supply (LOTO)", done: true },
      { id: "c2", label: "Replace drive belt", done: false },
      { id: "c3", label: "Check pulley alignment", done: false },
      { id: "c4", label: "Test run & log vibration", done: false },
    ],
  },
  {
    id: "wo-1045",
    title: "Transformer monthly check",
    asset: "Transformer T1 (1.6 MVA)",
    building: "Riverside Mall",
    type: "Preventive",
    priority: "medium",
    due: "12-06-2026",
    status: "open",
    checklist: [
      { id: "c1", label: "Check oil level & colour", done: false },
      { id: "c2", label: "Record winding temperature", done: false },
      { id: "c3", label: "Inspect silica gel breather", done: false },
      { id: "c4", label: "Clean bushings", done: false },
    ],
  },
  {
    id: "wo-1046",
    title: "Cold-room door seal repair",
    asset: "Cold room 2 door",
    building: "CoolChain Cold Storage",
    type: "Breakdown",
    priority: "high",
    due: "07-06-2026",
    status: "done",
    checklist: [
      { id: "c1", label: "Remove damaged gasket", done: true },
      { id: "c2", label: "Fit new gasket", done: true },
      { id: "c3", label: "Verify door seal & temp hold", done: true },
    ],
  },
];

export function getWorkOrder(id: string): WorkOrder | undefined {
  return WORK_ORDERS.find((w) => w.id === id);
}

/* ----------------------------------------------------------------- Audit */

export const AUDIT_META = {
  building: "Acme Bhosari Plant",
  auditor: "S. Nair (BEE-AEA)",
  date: "08-06-2026",
};

export type AuditSection = "Lighting" | "HVAC" | "Motors & pumps" | "Compressed air";
export const AUDIT_SECTIONS: AuditSection[] = [
  "Lighting",
  "HVAC",
  "Motors & pumps",
  "Compressed air",
];

export type Measurement = {
  id: string;
  section: AuditSection;
  label: string;
  unit: string;
};

export const AUDIT_MEASUREMENTS: Measurement[] = [
  { id: "m1", section: "Lighting", label: "Average lux level", unit: "lux" },
  { id: "m2", section: "Lighting", label: "Lamp count", unit: "nos" },
  { id: "m3", section: "Lighting", label: "Connected load", unit: "kW" },
  { id: "m4", section: "HVAC", label: "Supply air temperature", unit: "°C" },
  { id: "m5", section: "HVAC", label: "Chilled water temperature", unit: "°C" },
  { id: "m6", section: "HVAC", label: "Chiller power draw", unit: "kW" },
  { id: "m7", section: "Motors & pumps", label: "Motor current", unit: "A" },
  { id: "m8", section: "Motors & pumps", label: "Pump head", unit: "m" },
  { id: "m9", section: "Motors & pumps", label: "Power factor", unit: "" },
  { id: "m10", section: "Compressed air", label: "System pressure", unit: "bar" },
  { id: "m11", section: "Compressed air", label: "Specific power", unit: "kW/CFM" },
  { id: "m12", section: "Compressed air", label: "Estimated leak rate", unit: "%" },
];

/* ------------------------------------------------------------ Collection */

export type StopStatus = "pending" | "collected";
export type Stop = {
  id: string;
  seq: number;
  consumer: string;
  address: string;
  amountINR: number;
  distanceKm: number;
  status: StopStatus;
};

export const COLLECTION_STOPS: Stop[] = [
  { id: "s1", seq: 1, consumer: "Sharma Textiles", address: "Shop 12, Bhosari", amountINR: 18400, distanceKm: 0.0, status: "pending" },
  { id: "s2", seq: 2, consumer: "Patil Traders", address: "Unit 7, MIDC", amountINR: 9250, distanceKm: 1.2, status: "pending" },
  { id: "s3", seq: 3, consumer: "Green Foods", address: "Plot 22, MIDC", amountINR: 24800, distanceKm: 0.8, status: "pending" },
  { id: "s4", seq: 4, consumer: "Kohli Engineering", address: "Shed 4, Bhosari", amountINR: 12100, distanceKm: 1.5, status: "pending" },
  { id: "s5", seq: 5, consumer: "Anand Plastics", address: "Gala 9, MIDC", amountINR: 6700, distanceKm: 0.6, status: "collected" },
  { id: "s6", seq: 6, consumer: "Verma Steel", address: "Plot 31, MIDC", amountINR: 31500, distanceKm: 2.1, status: "pending" },
];
