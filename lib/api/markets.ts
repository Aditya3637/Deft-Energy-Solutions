import * as M from "@/lib/mock/energy-markets";

export { oaEconomics } from "@/lib/mock/energy-markets";

export const markets = {
  ghgScopes: async () => M.GHG_SCOPES,
  openAccess: async () => M.OA,
  iex: async () => M.IEX,
  carbonCredits: async () => M.CARBON_CREDITS,
  bess: async () => M.BESS,
  microgrid: async () => M.MICROGRID,
  vpp: async () => M.VPP,
};
