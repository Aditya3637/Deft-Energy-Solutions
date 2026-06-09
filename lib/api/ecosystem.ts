import * as M from "@/lib/mock/ecosystem";

export type { Vendor, Rfq, Bid, Course, Badge } from "@/lib/mock/ecosystem";
export const LANGUAGES = M.LANGUAGES;

export const ecosystem = {
  vendors: async (): Promise<M.Vendor[]> => M.VENDORS,
  rfqs: async (): Promise<M.Rfq[]> => M.RFQS,
  reverseAuction: async () => M.REVERSE_AUCTION,
  courses: async (): Promise<M.Course[]> => M.COURSES,
  badges: async (): Promise<M.Badge[]> => M.BADGES,
  rewards: async () => M.REWARDS,
};
