import { cache } from "react";

import * as M from "@/lib/mock/ecosystem";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export type { Vendor, Rfq, Bid, Course, Badge } from "@/lib/mock/ecosystem";
export const LANGUAGES = M.LANGUAGES;

type Leaderboard = { badges: M.Badge[]; rewards: typeof M.REWARDS };
type Marketplace = { vendors: M.Vendor[]; rfqs: M.Rfq[]; reverseAuction: typeof M.REVERSE_AUCTION };
type Training = { courses: M.Course[] };

/**
 * B7 ecosystem. Org-specific parts (badges, reward points, RFQs) are derived
 * from real data server-side; the vendor directory and course library are
 * curated platform catalogs served by the backend. Each endpoint is fetched
 * once per render (React `cache`), with the fixture as the off-server fallback.
 */
const fetchLeaderboard = cache(async (): Promise<Leaderboard | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<Leaderboard>("/v1/leaderboard", NO_STORE);
  } catch {
    return null;
  }
});

const fetchMarketplace = cache(async (): Promise<Marketplace | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<Marketplace>("/v1/marketplace", NO_STORE);
  } catch {
    return null;
  }
});

const fetchTraining = cache(async (): Promise<Training | null> => {
  if (!liveServer()) return null;
  try {
    return await apiFetch<Training>("/v1/training", NO_STORE);
  } catch {
    return null;
  }
});

export const ecosystem = {
  vendors: async (): Promise<M.Vendor[]> => (await fetchMarketplace())?.vendors ?? M.VENDORS,
  rfqs: async (): Promise<M.Rfq[]> => (await fetchMarketplace())?.rfqs ?? M.RFQS,
  reverseAuction: async () => (await fetchMarketplace())?.reverseAuction ?? M.REVERSE_AUCTION,
  courses: async (): Promise<M.Course[]> => (await fetchTraining())?.courses ?? M.COURSES,
  badges: async (): Promise<M.Badge[]> => (await fetchLeaderboard())?.badges ?? M.BADGES,
  rewards: async () => (await fetchLeaderboard())?.rewards ?? M.REWARDS,
};
