import * as M from "@/lib/mock/capex";

export type { CapexRequest, Stage } from "@/lib/mock/capex";
export const STAGE_FLOW = M.STAGE_FLOW;
export const STAGE_LABELS = M.STAGE_LABELS;

export const capex = {
  requests: async (): Promise<M.CapexRequest[]> => M.CAPEX_REQUESTS,
};
