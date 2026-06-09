/**
 * Portfolio data API. Returns fixtures by default; on Vercel SSR (and only
 * server-side, when the API is configured) it fetches the live backend behind
 * the SAME signatures. The GitHub Pages static build keeps baking fixtures
 * (it has no `process.env.VERCEL`), so this is safe for both deployments. Live
 * fetches fall back to fixtures if the backend is unreachable.
 */
import * as M from "@/lib/mock/portfolio";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

export type { Building, RecentBill, SeriesPoint } from "@/lib/mock/portfolio";
export const MONTHS = M.MONTHS;
export const BUDGET_L = M.BUDGET_L;
export const TOTAL_BILLS_TRACKED = M.TOTAL_BILLS_TRACKED;

/** Only hit the live API when rendering server-side on Vercel with an API URL set. */
function live(): boolean {
  return !!process.env.VERCEL && isApiConfigured();
}
const NO_STORE = { cache: "no-store" as const };

/** Server Building (Prisma) → frontend Building shape. */
type ServerBuilding = {
  id: string;
  name: string;
  city: string;
  type: "INDUSTRIAL" | "COMMERCIAL";
  discom: string;
  supplyVoltage: string | null;
  tariffCategory: string | null;
  areaSqft: number | null;
  sanctionedLoadKw: number | null;
  contractDemandKva: number | null;
  pf: number | null;
  epi: number | null;
  savingsInr: number;
  billsReceived: number;
  billsExpected: number;
  trendL: number[];
};

function mapBuilding(b: ServerBuilding): M.Building {
  return {
    id: b.id,
    name: b.name,
    city: b.city,
    type: b.type === "INDUSTRIAL" ? "Industrial" : "Commercial",
    discom: b.discom,
    supplyVoltage: b.supplyVoltage ?? "",
    tariffCategory: b.tariffCategory ?? "",
    areaSqft: b.areaSqft ?? 0,
    sanctionedLoadKw: b.sanctionedLoadKw ?? 0,
    contractDemandKva: b.contractDemandKva ?? 0,
    pf: b.pf ?? 0,
    epi: b.epi ?? 0,
    savingsINR: b.savingsInr,
    billsReceived: b.billsReceived,
    billsExpected: b.billsExpected,
    trendL: b.trendL ?? [],
  };
}

export const portfolio = {
  buildings: async (): Promise<M.Building[]> => {
    if (live()) {
      try {
        const data = await apiFetch<ServerBuilding[]>("/v1/buildings", NO_STORE);
        return data.map(mapBuilding);
      } catch {
        /* fall back to fixtures */
      }
    }
    return M.BUILDINGS;
  },

  building: async (id: string): Promise<M.Building | undefined> => {
    if (live()) {
      try {
        const b = await apiFetch<ServerBuilding | null>(`/v1/buildings/${id}`, NO_STORE);
        return b ? mapBuilding(b) : undefined;
      } catch {
        /* fall back */
      }
    }
    return M.getBuilding(id);
  },

  totals: async () => {
    if (live()) {
      try {
        return await apiFetch<ReturnType<typeof M.portfolioTotals>>("/v1/portfolio/totals", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return M.portfolioTotals();
  },

  monthly: async (): Promise<number[]> => {
    if (live()) {
      try {
        return await apiFetch<number[]>("/v1/portfolio/monthly", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return M.portfolioMonthlyL();
  },

  forecast: async (): Promise<M.SeriesPoint[]> => {
    if (live()) {
      try {
        return await apiFetch<M.SeriesPoint[]>("/v1/portfolio/forecast", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return M.forecastL();
  },

  recentBills: async (): Promise<M.RecentBill[]> => {
    if (live()) {
      try {
        return await apiFetch<M.RecentBill[]>("/v1/portfolio/recent-bills", NO_STORE);
      } catch {
        /* fall back */
      }
    }
    return M.RECENT_BILLS;
  },
};
