/**
 * Ecosystem (B7) invariants (CI — `ts-node --transpile-only`).
 *
 * Customer-angle test: org personas across DISCOMs (MSEDCL / BESCOM / TANGEDCO).
 * Badges, reward points and RFQs are DERIVED from real data, so the discipline
 * matches the rest — a badge is earned ONLY when the data proves it, points come
 * from a transparent formula over real counts, and a brand-new org earns nothing
 * and shows empty RFQs (no fabricated achievements/bids). Non-zero exit on fail.
 */

import { COURSES, REDEEMABLE } from "../src/ecosystem/ecosystem.catalog";
import {
  badges,
  courses,
  reverseAuction,
  rewards,
  rfqs,
  type CapexRow,
  type EcosystemInput,
} from "../src/ecosystem/ecosystem.compute";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

const earned = (input: EcosystemInput, id: string) => badges(input).find((b) => b.id === id)!.earned;

const onTimeBill = (pf: number) => ({
  powerFactor: pf,
  paidAt: new Date("2026-05-10T00:00:00Z"),
  dueOn: new Date("2026-05-15T00:00:00Z"),
  energyKwh: 50_000,
  totalAmountDue: 400_000,
});

console.log("Ecosystem (B7) invariants (multi-DISCOM personas):");

// ── Persona 1: "Pune Champion" (MSEDCL) — high performer, earns badges ─────────
{
  const input: EcosystemInput = {
    // 12 bills, all paid on time, all PF > 0.95
    bills: Array.from({ length: 12 }, () => onTimeBill(0.98)),
    buildings: [{ trendL: [10, 10, 10, 9, 9, 8, 8, 7, 7, 8, 8, 8], savingsInr: 3_000_000 }],
    tasksDone: 8,
    capex: [],
  };
  check(earned(input, "b1"), "P1 all PF > 0.95 → PF Perfect earned");
  check(earned(input, "b2"), "P1 ≥10% trend reduction → Green Champion earned");
  check(earned(input, "b4"), "P1 12 bills on time → Bill Hawk earned");
  check(!earned(input, "b5"), "P1 no audit module → Audit Ace NOT earned (honest)");
  const r = rewards(input, REDEEMABLE);
  check(r.points > 0 && ["Silver", "Gold", "Platinum"].includes(r.tier), "P1 active org → points & a real tier");
  check(r.redeemable === REDEEMABLE, "P1 redeemable = curated catalog");
}

// ── Persona 2: "Bengaluru Lagging" (BESCOM) — one poor PF site, no reduction ────
{
  const input: EcosystemInput = {
    bills: [onTimeBill(0.98), onTimeBill(0.88)], // one site below 0.95
    buildings: [{ trendL: [8, 8, 8, 8, 8, 8, 9, 9, 9, 10, 10, 10], savingsInr: 0 }], // spend rising
    tasksDone: 0,
    capex: [],
  };
  check(!earned(input, "b1"), "P2 one site PF 0.88 → PF Perfect NOT earned (no false award)");
  check(!earned(input, "b2"), "P2 spend rose → Green Champion NOT earned");
  check(!earned(input, "b4"), "P2 only 2 bills → Bill Hawk NOT earned");
}

// ── Persona 3: "Chennai Carbon" (TANGEDCO) — large avoided emissions ───────────
{
  const input: EcosystemInput = {
    bills: [{ powerFactor: 0.92, paidAt: null, dueOn: null, energyKwh: 10_000_000, totalAmountDue: 80_000_000 }],
    buildings: [{ trendL: [], savingsInr: 30_000_000 }],
    tasksDone: 0,
    capex: [],
  };
  check(earned(input, "b3"), "P3 >1,000 tCO₂e avoided → Carbon Warrior earned");
}

// ── Persona 4: RFQs derived from the org's real capital requests ───────────────
{
  const capex: CapexRow[] = [
    { id: "cx1", project: "300 kVAR APFC panel", building: "CoolChain", amountInr: 412_000, paybackYrs: 1.2, stage: "FM", createdAt: new Date("2026-05-20T00:00:00Z") },
    { id: "cx2", project: "100 kWp rooftop solar", building: "Orchid Tower", amountInr: 5_500_000, paybackYrs: 4.5, stage: "CFO", createdAt: new Date("2026-05-10T00:00:00Z") },
    { id: "cx3", project: "LED retrofit", building: "TechPark", amountInr: 800_000, paybackYrs: 2.0, stage: "APPROVED", createdAt: new Date("2026-04-01T00:00:00Z") },
  ];
  const list = rfqs(capex);
  check(list.length === 3, "P4 one RFQ per capital request");
  check(list[0].id === "cx1", "P4 RFQs sorted newest-first");
  check(list.find((r) => r.id === "cx1")!.category === "Power factor", "P4 APFC → Power factor category");
  check(list.find((r) => r.id === "cx2")!.category === "Solar", "P4 rooftop solar → Solar category");
  check(list.find((r) => r.id === "cx1")!.status === "open", "P4 stage FM → open");
  check(list.find((r) => r.id === "cx2")!.status === "evaluating", "P4 stage CFO → evaluating");
  check(list.find((r) => r.id === "cx3")!.status === "awarded", "P4 stage APPROVED → awarded");
  check(list.every((r) => r.bids === 0), "P4 no bidding system yet → 0 bids (honest)");
  check(/^\d{2}-\d{2}-\d{4}$/.test(list[0].closes), "P4 closes is a DD-MM-YYYY date");

  const ra = reverseAuction(capex);
  check(ra.title.startsWith("300 kVAR APFC panel"), "P4 reverse auction = top OPEN RFQ");
  check(ra.bids.length === 0, "P4 reverse auction has no fabricated bids");
}

// ── Persona 5: brand-new org — nothing earned, no RFQs, courses at 0% ──────────
{
  const empty: EcosystemInput = { bills: [], buildings: [], tasksDone: 0, capex: [] };
  check(badges(empty).every((b) => !b.earned), "P5 empty org → no badges earned");
  const r = rewards(empty, REDEEMABLE);
  check(r.points === 0 && r.tier === "Bronze", "P5 empty org → 0 points, Bronze tier");
  check(rfqs([]).length === 0, "P5 no capex → no RFQs");
  check(reverseAuction([]).title === "No active reverse auction", "P5 no capex → no auction (honest)");
  const cs = courses(COURSES);
  check(cs.length === COURSES.length && cs.every((c) => c.progressPct === 0), "P5 course catalog served, progress 0");
  check(cs.every((c) => c.progressPct >= 0 && c.progressPct <= 100), "course progress bounded 0–100");
}

if (failures > 0) {
  console.error(`\n${failures} ecosystem invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll ecosystem (B7) invariants hold.");
