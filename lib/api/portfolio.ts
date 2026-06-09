/**
 * Portfolio data API (Stage D seam). Async functions returning fixtures today;
 * at Stage F the bodies call the real backend behind the SAME signatures.
 * Pure domain constants/types are re-exported for convenience.
 */
import * as M from "@/lib/mock/portfolio";

export type { Building, RecentBill, SeriesPoint } from "@/lib/mock/portfolio";
export const MONTHS = M.MONTHS;
export const BUDGET_L = M.BUDGET_L;
export const TOTAL_BILLS_TRACKED = M.TOTAL_BILLS_TRACKED;

export const portfolio = {
  buildings: async (): Promise<M.Building[]> => M.BUILDINGS,
  building: async (id: string): Promise<M.Building | undefined> => M.getBuilding(id),
  totals: async () => M.portfolioTotals(),
  monthly: async (): Promise<number[]> => M.portfolioMonthlyL(),
  forecast: async (): Promise<M.SeriesPoint[]> => M.forecastL(),
  recentBills: async (): Promise<M.RecentBill[]> => M.RECENT_BILLS,
};
