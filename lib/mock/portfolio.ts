/**
 * Mock portfolio data for Stage B2 (account & portfolio screens).
 * Deterministic (no random/date-at-render) to avoid hydration mismatches.
 * Seed of the future mock-API seam; Stage F swaps in real services.
 */

export const MONTHS = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
] as const;

export type Building = {
  id: string;
  name: string;
  city: string;
  type: "Industrial" | "Commercial";
  discom: string;
  supplyVoltage: string;
  tariffCategory: string;
  areaSqft: number;
  sanctionedLoadKw: number;
  contractDemandKva: number;
  pf: number;
  /** Energy Performance Index, kWh/sq.ft/year. */
  epi: number;
  /** Annual savings identified, ₹. */
  savingsINR: number;
  billsReceived: number;
  billsExpected: number;
  /** 12-month spend trend in ₹ lakh, aligned to MONTHS. */
  trendL: number[];
};

export const BUILDINGS: Building[] = [
  {
    id: "acme-bhosari",
    name: "Acme Bhosari Plant",
    city: "Pune",
    type: "Industrial",
    discom: "MSEDCL",
    supplyVoltage: "HT (22 kV)",
    tariffCategory: "HT-I (Industrial)",
    areaSqft: 120000,
    sanctionedLoadKw: 850,
    contractDemandKva: 1000,
    pf: 0.91,
    epi: 14.2,
    savingsINR: 2767776,
    billsReceived: 12,
    billsExpected: 12,
    trendL: [42, 44, 46, 48, 51, 49, 47, 45, 44, 46, 45, 44.8],
  },
  {
    id: "acme-chakan",
    name: "Acme Chakan Unit 2",
    city: "Pune",
    type: "Industrial",
    discom: "MSEDCL",
    supplyVoltage: "HT (22 kV)",
    tariffCategory: "HT-I (Industrial)",
    areaSqft: 95000,
    sanctionedLoadKw: 620,
    contractDemandKva: 750,
    pf: 0.96,
    epi: 11.8,
    savingsINR: 810000,
    billsReceived: 12,
    billsExpected: 12,
    trendL: [31, 32, 33, 34, 36, 35, 34, 33, 32, 33, 33, 32.5],
  },
  {
    id: "orchid-tower",
    name: "Orchid Tower (HQ)",
    city: "Mumbai",
    type: "Commercial",
    discom: "Adani Electricity",
    supplyVoltage: "HT (11 kV)",
    tariffCategory: "HT-II (Commercial)",
    areaSqft: 210000,
    sanctionedLoadKw: 1400,
    contractDemandKva: 1650,
    pf: 0.99,
    epi: 9.1,
    savingsINR: 540000,
    billsReceived: 12,
    billsExpected: 12,
    trendL: [58, 60, 62, 68, 72, 70, 66, 61, 59, 60, 61, 62.4],
  },
  {
    id: "riverside-mall",
    name: "Riverside Mall",
    city: "Bengaluru",
    type: "Commercial",
    discom: "BESCOM",
    supplyVoltage: "HT (11 kV)",
    tariffCategory: "HT-2 (Commercial)",
    areaSqft: 320000,
    sanctionedLoadKw: 2100,
    contractDemandKva: 2500,
    pf: 0.93,
    epi: 13.5,
    savingsINR: 1890000,
    billsReceived: 11,
    billsExpected: 12,
    trendL: [74, 76, 79, 84, 88, 86, 82, 78, 75, 77, 78, 80.1],
  },
  {
    id: "coolchain-cold",
    name: "CoolChain Cold Storage",
    city: "Chennai",
    type: "Industrial",
    discom: "TANGEDCO",
    supplyVoltage: "HT (22 kV)",
    tariffCategory: "HT-I (Industrial)",
    areaSqft: 60000,
    sanctionedLoadKw: 720,
    contractDemandKva: 900,
    pf: 0.88,
    epi: 28.4,
    savingsINR: 2230000,
    billsReceived: 12,
    billsExpected: 12,
    trendL: [38, 40, 43, 47, 52, 55, 53, 49, 45, 42, 41, 43.6],
  },
  {
    id: "techpark-c",
    name: "TechPark Block C",
    city: "Hyderabad",
    type: "Commercial",
    discom: "TSSPDCL",
    supplyVoltage: "HT (11 kV)",
    tariffCategory: "HT-II (Commercial)",
    areaSqft: 140000,
    sanctionedLoadKw: 980,
    contractDemandKva: 1150,
    pf: 0.95,
    epi: 10.7,
    savingsINR: 620000,
    billsReceived: 9,
    billsExpected: 12,
    trendL: [33, 34, 35, 38, 41, 40, 38, 36, 35, 35, 36, 36.8],
  },
];

export function getBuilding(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

const L = 100000; // one lakh

/** Portfolio spend per month in ₹ lakh, summed across buildings. */
export function portfolioMonthlyL(): number[] {
  return MONTHS.map((_, i) =>
    Math.round(BUILDINGS.reduce((s, b) => s + b.trendL[i], 0) * 10) / 10,
  );
}

export function portfolioTotals() {
  const monthly = portfolioMonthlyL();
  const monthlySpendINR = Math.round(monthly[monthly.length - 1] * L);
  const annualSpendINR = Math.round(monthly.reduce((s, v) => s + v, 0) * L);
  const savingsINR = BUILDINGS.reduce((s, b) => s + b.savingsINR, 0);
  const billsReceived = BUILDINGS.reduce((s, b) => s + b.billsReceived, 0);
  const billsExpected = BUILDINGS.reduce((s, b) => s + b.billsExpected, 0);
  return {
    buildings: BUILDINGS.length,
    monthlySpendINR,
    annualSpendINR,
    savingsINR,
    billsReceived,
    billsExpected,
  };
}

/** Monthly portfolio budget, ₹ lakh. */
export const BUDGET_L = 320;

export type SeriesPoint = { label: string; value: number; predicted?: boolean };

/** 12 actual months + 3 projected months for the forecast view (₹ lakh). */
export function forecastL(): SeriesPoint[] {
  const actual = portfolioMonthlyL();
  const last = actual[actual.length - 1];
  const projected = [last * 1.06, last * 1.11, last * 1.04].map(
    (v) => Math.round(v * 10) / 10,
  );
  const future = ["Jul", "Aug", "Sep"];
  return [
    ...actual.map((v, i) => ({ label: MONTHS[i], value: v })),
    ...projected.map((v, i) => ({ label: future[i], value: v, predicted: true })),
  ];
}

export type RecentBill = {
  id: string;
  buildingId: string;
  building: string;
  discom: string;
  month: string;
  kwh: number;
  amountINR: number;
  pf: number;
  status: "Analyzed" | "Pending" | "Anomaly";
};

/** A deterministic recent-bills list for the Bills screen. */
export const RECENT_BILLS: RecentBill[] = BUILDINGS.flatMap((b) => {
  const months = ["May 2026", "Apr 2026"];
  return months.map((m, i) => {
    const spendL = b.trendL[b.trendL.length - 1 - i];
    const amountINR = Math.round(spendL * L);
    // Approx kWh from spend at ~₹7.8/kWh.
    const kwh = Math.round(amountINR / 7.8);
    const status: RecentBill["status"] =
      b.billsReceived < b.billsExpected && i === 0
        ? "Pending"
        : b.pf < 0.9
          ? "Anomaly"
          : "Analyzed";
    return {
      id: `${b.id}-${i}`,
      buildingId: b.id,
      building: b.name,
      discom: b.discom,
      month: m,
      kwh,
      amountINR,
      pf: b.pf,
      status,
    };
  });
});

export const TOTAL_BILLS_TRACKED = 1248;
