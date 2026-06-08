/** Mock CAPEX approval workflow (F10): FM → EM → CFO → Board. Deterministic. */

export type Stage = "fm" | "em" | "cfo" | "board" | "approved" | "rejected";

export const STAGE_FLOW: Stage[] = ["fm", "em", "cfo", "board", "approved"];

export const STAGE_LABELS: Record<Stage, string> = {
  fm: "Facility Mgr",
  em: "Energy Mgr",
  cfo: "CFO",
  board: "Board",
  approved: "Approved",
  rejected: "Rejected",
};

export type CapexRequest = {
  id: string;
  project: string;
  building: string;
  amountINR: number;
  paybackYrs: number;
  requestedBy: string;
  stage: Stage;
};

export const CAPEX_REQUESTS: CapexRequest[] = [
  { id: "cx1", project: "APFC power-factor panel", building: "CoolChain Cold Storage", amountINR: 450000, paybackYrs: 0.8, requestedBy: "S. Nair", stage: "em" },
  { id: "cx2", project: "Rooftop solar 100 kWp", building: "Orchid Tower (HQ)", amountINR: 4500000, paybackYrs: 7.3, requestedBy: "A. Iyer", stage: "cfo" },
  { id: "cx3", project: "BESS peak shaving", building: "Riverside Mall", amountINR: 6000000, paybackYrs: 6.3, requestedBy: "R. Mehta", stage: "fm" },
  { id: "cx4", project: "LED retrofit", building: "TechPark Block C", amountINR: 320000, paybackYrs: 1.5, requestedBy: "A. Iyer", stage: "board" },
  { id: "cx5", project: "ToD load-shift controls", building: "Acme Bhosari Plant", amountINR: 300000, paybackYrs: 0.3, requestedBy: "R. Mehta", stage: "approved" },
];
