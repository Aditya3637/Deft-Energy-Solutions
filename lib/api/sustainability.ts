import * as M from "@/lib/mock/sustainability";

export type { Obligation, ComplianceStatus, Risk, ExecOpportunity } from "@/lib/mock/sustainability";

export const sustainability = {
  carbon: async () => M.CARBON,
  carbonTotal: async (): Promise<number> => M.CARBON_TOTAL,
  esg: async () => M.ESG,
  netZero: async () => M.NET_ZERO,
  obligations: async (): Promise<M.Obligation[]> => M.OBLIGATIONS,
  brsrSections: async () => M.BRSR_SECTIONS,
  risks: async (): Promise<M.Risk[]> => M.RISKS,
  opportunities: async (): Promise<M.ExecOpportunity[]> => M.EXEC_OPPORTUNITIES,
};
