/**
 * Curated platform catalogs (Stage B7) — genuinely global content, not org data.
 *
 * The vendor directory and the course library are the same for every tenant, so
 * serving a real curated dataset from the backend IS the production-grade "live"
 * version — there is no per-org data to derive or fabricate. Per-org state
 * (course progress, RFQ bids) is layered on separately and honestly: until those
 * transactional features exist, progress is 0 and bid lists are empty.
 */

export type Vendor = {
  id: string;
  name: string;
  category: string;
  rating: number;
  jobs: number;
  location: string;
};

/** Vetted Indian energy-services vendors, by capability. */
export const VENDORS: Vendor[] = [
  { id: "v1", name: "Voltas APFC Solutions", category: "Power factor", rating: 4.7, jobs: 142, location: "Pune" },
  { id: "v2", name: "Tata Power Solar", category: "Solar", rating: 4.8, jobs: 310, location: "Mumbai" },
  { id: "v3", name: "Exide Energy", category: "BESS", rating: 4.5, jobs: 88, location: "Bengaluru" },
  { id: "v4", name: "Schneider Retrofit", category: "HVAC / controls", rating: 4.6, jobs: 205, location: "Chennai" },
  { id: "v5", name: "Wipro Lighting", category: "Lighting", rating: 4.4, jobs: 176, location: "Hyderabad" },
  { id: "v6", name: "Crompton Motors", category: "Motors / VFD", rating: 4.3, jobs: 121, location: "Pune" },
];

export type CourseTemplate = {
  id: string;
  title: string;
  category: string;
  hours: number;
  level: "Beginner" | "Intermediate" | "Advanced";
};

/** The training library. Progress is layered per-org (0 until the learner starts). */
export const COURSES: CourseTemplate[] = [
  { id: "c1", title: "Reading an HT electricity bill", category: "Fundamentals", hours: 2, level: "Beginner" },
  { id: "c2", title: "Power factor & APFC sizing", category: "Efficiency", hours: 3, level: "Intermediate" },
  { id: "c3", title: "Contract demand optimisation", category: "Efficiency", hours: 2, level: "Intermediate" },
  { id: "c4", title: "Open access & the power exchange", category: "Markets", hours: 4, level: "Advanced" },
  { id: "c5", title: "BRSR & carbon accounting", category: "Compliance", hours: 3, level: "Intermediate" },
  { id: "c6", title: "BESS economics & sizing", category: "Assets", hours: 3, level: "Advanced" },
];

export type Reward = { id: string; name: string; cost: number };

/** Redeemable rewards catalog (platform credit + partner perks). */
export const REDEEMABLE: Reward[] = [
  { id: "rw1", name: "1 month Pro plan credit", cost: 2500 },
  { id: "rw2", name: "Free energy-audit voucher", cost: 4000 },
  { id: "rw3", name: "Partner retrofit discount 5%", cost: 6000 },
];
