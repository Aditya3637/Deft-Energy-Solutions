/** Mock data for Stage B7 (ecosystem & growth): marketplace, training, gamification. Deterministic. */

/* --------------------------------------------------------------- Marketplace */

export type Vendor = {
  id: string;
  name: string;
  category: string;
  rating: number;
  jobs: number;
  location: string;
};

export const VENDORS: Vendor[] = [
  { id: "v1", name: "Voltas APFC Solutions", category: "Power factor", rating: 4.7, jobs: 142, location: "Pune" },
  { id: "v2", name: "Tata Power Solar", category: "Solar", rating: 4.8, jobs: 310, location: "Mumbai" },
  { id: "v3", name: "Exide Energy", category: "BESS", rating: 4.5, jobs: 88, location: "Bengaluru" },
  { id: "v4", name: "Schneider Retrofit", category: "HVAC / controls", rating: 4.6, jobs: 205, location: "Chennai" },
  { id: "v5", name: "Wipro Lighting", category: "Lighting", rating: 4.4, jobs: 176, location: "Hyderabad" },
  { id: "v6", name: "Crompton Motors", category: "Motors / VFD", rating: 4.3, jobs: 121, location: "Pune" },
];

export type Rfq = {
  id: string;
  title: string;
  category: string;
  bids: number;
  closes: string;
  status: "open" | "evaluating" | "awarded";
};

export const RFQS: Rfq[] = [
  { id: "rfq1", title: "300 kVAR APFC panel — CoolChain", category: "Power factor", bids: 5, closes: "14-06-2026", status: "open" },
  { id: "rfq2", title: "100 kWp rooftop solar — Orchid Tower", category: "Solar", bids: 8, closes: "20-06-2026", status: "evaluating" },
  { id: "rfq3", title: "LED retrofit — TechPark Block C", category: "Lighting", bids: 6, closes: "08-06-2026", status: "awarded" },
];

export type Bid = { vendor: string; amountINR: number; tcoINR: number; deliveryWeeks: number };

export const REVERSE_AUCTION = {
  title: "300 kVAR APFC panel — CoolChain Cold Storage",
  closesIn: "2h 14m",
  bids: [
    { vendor: "Voltas APFC Solutions", amountINR: 412000, tcoINR: 498000, deliveryWeeks: 4 },
    { vendor: "Schneider Retrofit", amountINR: 438000, tcoINR: 505000, deliveryWeeks: 3 },
    { vendor: "Crompton Motors", amountINR: 451000, tcoINR: 540000, deliveryWeeks: 5 },
  ] as Bid[],
};

/* ----------------------------------------------------------------- Training */

export type Course = {
  id: string;
  title: string;
  category: string;
  hours: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  progressPct: number;
};

export const COURSES: Course[] = [
  { id: "c1", title: "Reading an HT electricity bill", category: "Fundamentals", hours: 2, level: "Beginner", progressPct: 100 },
  { id: "c2", title: "Power factor & APFC sizing", category: "Efficiency", hours: 3, level: "Intermediate", progressPct: 60 },
  { id: "c3", title: "Contract demand optimisation", category: "Efficiency", hours: 2, level: "Intermediate", progressPct: 40 },
  { id: "c4", title: "Open access & the power exchange", category: "Markets", hours: 4, level: "Advanced", progressPct: 0 },
  { id: "c5", title: "BRSR & carbon accounting", category: "Compliance", hours: 3, level: "Intermediate", progressPct: 25 },
  { id: "c6", title: "BESS economics & sizing", category: "Assets", hours: 3, level: "Advanced", progressPct: 0 },
];

/* -------------------------------------------------------------- Gamification */

export type Badge = { id: string; name: string; desc: string; earned: boolean };

export const BADGES: Badge[] = [
  { id: "b1", name: "PF Perfect", desc: "All sites above 0.95 power factor", earned: false },
  { id: "b2", name: "Green Champion", desc: "10% portfolio energy reduction", earned: true },
  { id: "b3", name: "Carbon Warrior", desc: "1,000 tCO₂e avoided", earned: true },
  { id: "b4", name: "Bill Hawk", desc: "12 bills uploaded on time", earned: true },
  { id: "b5", name: "Audit Ace", desc: "Complete an on-site audit", earned: false },
];

export const REWARDS = {
  points: 4820,
  tier: "Gold",
  redeemable: [
    { id: "rw1", name: "1 month Pro plan credit", cost: 2500 },
    { id: "rw2", name: "Free energy-audit voucher", cost: 4000 },
    { id: "rw3", name: "Partner retrofit discount 5%", cost: 6000 },
  ],
};

/* -------------------------------------------------------------- Localisation */

export const LANGUAGES = [
  "English",
  "हिन्दी (Hindi)",
  "தமிழ் (Tamil)",
  "తెలుగు (Telugu)",
  "मराठी (Marathi)",
  "ಕನ್ನಡ (Kannada)",
  "বাংলা (Bengali)",
];
