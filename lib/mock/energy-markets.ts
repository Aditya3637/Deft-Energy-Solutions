/** Mock data for Stage B6 (energy markets & assets): OA, IEX, carbon, BESS, microgrid, VPP. Deterministic. */

/* ----------------------------------------------------------- GHG inventory */

export const GHG_SCOPES = [
  {
    scope: "Scope 1",
    note: "Direct — diesel & refrigerants",
    tco2e: 1240,
    sources: [
      { name: "Diesel (DG sets)", tco2e: 920 },
      { name: "Refrigerant leakage", tco2e: 320 },
    ],
  },
  {
    scope: "Scope 2",
    note: "Purchased electricity — auto from bills",
    tco2e: 8650,
    sources: [
      { name: "Grid — Maharashtra", tco2e: 3100 },
      { name: "Grid — Karnataka", tco2e: 2400 },
      { name: "Grid — Tamil Nadu", tco2e: 1900 },
      { name: "Grid — others", tco2e: 1250 },
    ],
  },
  {
    scope: "Scope 3",
    note: "Value chain",
    tco2e: 3110,
    sources: [
      { name: "Employee commute", tco2e: 1400 },
      { name: "Purchased goods", tco2e: 890 },
      { name: "Business travel", tco2e: 820 },
    ],
  },
];

/* --------------------------------------------------------------- Open access */

export const OA = {
  eligible: true,
  loadKw: 850,
  monthlyKwh: 428000,
  gridRateINR: 7.6,
  exchangeRateINR: 4.2,
  charges: [
    { name: "Wheeling charge", rate: 0.6 },
    { name: "Cross-subsidy surcharge", rate: 1.2 },
    { name: "Additional surcharge", rate: 0.3 },
    { name: "Transmission charge", rate: 0.25 },
    { name: "Losses (~4%)", rate: 0.17 },
  ],
  steps: ["Eligibility", "State charges", "SLDC NOC", "Scheduling"],
};

export type OpenAccessData = {
  gridRateINR: number;
  exchangeRateINR: number;
  monthlyKwh: number;
  charges: { name: string; rate: number; indicative?: boolean }[];
};

/** Open-access economics from an OA object (live-derived or the fixture). */
export function oaEconomics(oa: OpenAccessData = OA) {
  const chargesTotal = oa.charges.reduce((s, c) => s + c.rate, 0);
  const landed = oa.exchangeRateINR + chargesTotal;
  const netPerUnit = oa.gridRateINR - landed;
  const annualINR = Math.round(netPerUnit * oa.monthlyKwh * 12);
  return { chargesTotal, landed, netPerUnit, annualINR };
}

/* ----------------------------------------------------------------- IEX market */

export const IEX = {
  lastMcpINR: 4.85,
  dayAvgINR: 4.12,
  peakINR: 8.9,
  offPeakINR: 2.7,
  asOf: "indicative reference",
  source: "indicative" as "indicative" | "iex",
  blocks: [
    { h: "00", p: 2.9 },
    { h: "02", p: 2.7 },
    { h: "04", p: 3.1 },
    { h: "06", p: 4.4 },
    { h: "08", p: 5.6 },
    { h: "10", p: 4.9 },
    { h: "12", p: 4.2 },
    { h: "14", p: 4.0 },
    { h: "16", p: 4.8 },
    { h: "18", p: 8.9 },
    { h: "20", p: 7.6 },
    { h: "22", p: 4.3 },
  ],
};

/* --------------------------------------------------------------- Carbon credits */

export const CARBON_CREDITS = {
  source: "estimated" as "estimated" | "registry",
  asOf: "estimated",
  held: 1200,
  retired: 300,
  ccPriceINR: 1450, // ₹ per Carbon Credit Certificate (CCTS)
  projects: [
    { name: "Rooftop solar — Orchid Tower", credits: 540 },
    { name: "APFC efficiency — CoolChain", credits: 270 },
    { name: "LED retrofit — TechPark", credits: 210 },
    { name: "ToD load shift — Acme", credits: 180 },
  ],
};

/* ------------------------------------------------------------------ Assets */

export const BESS = {
  peakKw: 2000,
  recommendedKw: 800,
  recommendedKwh: 1600,
  capexINR: 6000000,
  demandSavingINR: 520000,
  arbitrageSavingINR: 430000,
  paybackYrs: 6.3,
};

export const MICROGRID = {
  islandingHours: 8,
  reliabilityPct: 99.98,
  renewableSharePct: 42,
  components: [
    { name: "Rooftop solar", spec: "100 kWp" },
    { name: "Battery storage", spec: "800 kW / 1600 kWh" },
    { name: "DG backup", spec: "500 kVA" },
    { name: "Grid connection", spec: "1000 kVA HT" },
  ],
};

export const VPP = {
  sites: 6,
  dispatchableKw: 3200,
  drEventsYTD: 4,
  drRevenueINR: 540000,
  der: [
    { name: "Solar", kw: 1200 },
    { name: "Battery", kw: 800 },
    { name: "Flexible loads (HVAC / EV)", kw: 1200 },
  ],
};
