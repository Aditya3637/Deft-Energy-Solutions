/**
 * Portfolio aggregates — server port of the frontend lib/mock/portfolio.ts
 * derivations (monthly spend, totals, forecast, recent bills), computed from
 * buildings' 12-month trend. Keeps the live dashboard identical to the demo.
 */
import type { Building } from "@prisma/client";

const L = 100000; // one lakh
export const MONTHS = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
];

export function monthlyL(buildings: Building[]): number[] {
  return MONTHS.map((_, i) =>
    Math.round(buildings.reduce((s, b) => s + (b.trendL[i] ?? 0), 0) * 10) / 10,
  );
}

export function totals(buildings: Building[]) {
  const m = monthlyL(buildings);
  return {
    buildings: buildings.length,
    monthlySpendINR: Math.round((m[m.length - 1] ?? 0) * L),
    annualSpendINR: Math.round(m.reduce((s, v) => s + v, 0) * L),
    savingsINR: buildings.reduce((s, b) => s + b.savingsInr, 0),
    billsReceived: buildings.reduce((s, b) => s + b.billsReceived, 0),
    billsExpected: buildings.reduce((s, b) => s + b.billsExpected, 0),
  };
}

export function forecast(buildings: Building[]) {
  const actual = monthlyL(buildings);
  const last = actual[actual.length - 1] ?? 0;
  const projected = [last * 1.06, last * 1.11, last * 1.04].map(
    (v) => Math.round(v * 10) / 10,
  );
  const future = ["Jul", "Aug", "Sep"];
  return [
    ...actual.map((v, i) => ({ label: MONTHS[i], value: v, predicted: false })),
    ...projected.map((v, i) => ({ label: future[i], value: v, predicted: true })),
  ];
}

export function recentBills(buildings: Building[]) {
  return buildings.flatMap((b) => {
    const months = ["May 2026", "Apr 2026"];
    return months.map((mo, i) => {
      const spendL = b.trendL[b.trendL.length - 1 - i] ?? 0;
      const amountINR = Math.round(spendL * L);
      const kwh = Math.round(amountINR / 7.8);
      const status =
        b.billsReceived < b.billsExpected && i === 0
          ? "Pending"
          : (b.pf ?? 1) < 0.9
            ? "Anomaly"
            : "Analyzed";
      return {
        id: `${b.id}-${i}`,
        buildingId: b.id,
        building: b.name,
        discom: b.discom,
        month: mo,
        kwh,
        amountINR,
        pf: b.pf,
        status,
      };
    });
  });
}
