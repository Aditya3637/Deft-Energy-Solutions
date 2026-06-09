/**
 * RLS-aware, idempotent seed. Runs in a transaction with the tenant set (works
 * under FORCE ROW LEVEL SECURITY). Upserts the 6 demo buildings by stable slug
 * id (so new columns like trendL backfill on existing rows), prunes any legacy
 * rows from earlier deploys, and ensures one sample bill. Compiled to
 * dist/seed.js and run on container boot.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const BUILDINGS = [
  { id: "acme-bhosari", name: "Acme Bhosari Plant", city: "Pune", type: "INDUSTRIAL", discom: "MSEDCL", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 120000, sanctionedLoadKw: 850, contractDemandKva: 1000, pf: 0.91, epi: 14.2, savingsInr: 2767776, billsReceived: 12, billsExpected: 12, trendL: [42, 44, 46, 48, 51, 49, 47, 45, 44, 46, 45, 44.8] },
  { id: "acme-chakan", name: "Acme Chakan Unit 2", city: "Pune", type: "INDUSTRIAL", discom: "MSEDCL", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 95000, sanctionedLoadKw: 620, contractDemandKva: 750, pf: 0.96, epi: 11.8, savingsInr: 810000, billsReceived: 12, billsExpected: 12, trendL: [31, 32, 33, 34, 36, 35, 34, 33, 32, 33, 33, 32.5] },
  { id: "orchid-tower", name: "Orchid Tower (HQ)", city: "Mumbai", type: "COMMERCIAL", discom: "Adani Electricity", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-II (Commercial)", areaSqft: 210000, sanctionedLoadKw: 1400, contractDemandKva: 1650, pf: 0.99, epi: 9.1, savingsInr: 540000, billsReceived: 12, billsExpected: 12, trendL: [58, 60, 62, 68, 72, 70, 66, 61, 59, 60, 61, 62.4] },
  { id: "riverside-mall", name: "Riverside Mall", city: "Bengaluru", type: "COMMERCIAL", discom: "BESCOM", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-2 (Commercial)", areaSqft: 320000, sanctionedLoadKw: 2100, contractDemandKva: 2500, pf: 0.93, epi: 13.5, savingsInr: 1890000, billsReceived: 11, billsExpected: 12, trendL: [74, 76, 79, 84, 88, 86, 82, 78, 75, 77, 78, 80.1] },
  { id: "coolchain-cold", name: "CoolChain Cold Storage", city: "Chennai", type: "INDUSTRIAL", discom: "TANGEDCO", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 60000, sanctionedLoadKw: 720, contractDemandKva: 900, pf: 0.88, epi: 28.4, savingsInr: 2230000, billsReceived: 12, billsExpected: 12, trendL: [38, 40, 43, 47, 52, 55, 53, 49, 45, 42, 41, 43.6] },
  { id: "techpark-c", name: "TechPark Block C", city: "Hyderabad", type: "COMMERCIAL", discom: "TSSPDCL", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-II (Commercial)", areaSqft: 140000, sanctionedLoadKw: 980, contractDemandKva: 1150, pf: 0.95, epi: 10.7, savingsInr: 620000, billsReceived: 9, billsExpected: 12, trendL: [33, 34, 35, 38, 41, 40, 38, 36, 35, 35, 36, 36.8] },
] as const;

const TASKS = [
  { id: "t1", title: "Apply to reduce contract demand to 800 kVA", building: "Acme Bhosari Plant", source: "DIAGNOSIS", priority: "HIGH", assignee: "R. Mehta", due: "20-06-2026", savingsInr: 1080000, status: "TODO" },
  { id: "t2", title: "Get quotes for APFC panel (raise PF to 0.95)", building: "CoolChain Cold Storage", source: "DIAGNOSIS", priority: "HIGH", assignee: "S. Nair", due: "24-06-2026", savingsInr: 578400, status: "TODO" },
  { id: "t3", title: "Investigate power-factor drop to 0.88", building: "CoolChain Cold Storage", source: "ALERT", priority: "HIGH", assignee: "S. Nair", due: "12-06-2026", savingsInr: null, status: "IN_PROGRESS" },
  { id: "t4", title: "Pilot ToD load-shift on chiller plant", building: "Acme Bhosari Plant", source: "DIAGNOSIS", priority: "MEDIUM", assignee: "R. Mehta", due: "30-06-2026", savingsInr: 1109000, status: "IN_PROGRESS" },
  { id: "t5", title: "Chase missing May bill from BESCOM", building: "Riverside Mall", source: "ALERT", priority: "MEDIUM", assignee: "A. Iyer", due: "10-06-2026", savingsInr: null, status: "IN_PROGRESS" },
  { id: "t6", title: "Upload 3 pending bills (data gap)", building: "TechPark Block C", source: "ALERT", priority: "MEDIUM", assignee: "A. Iyer", due: "15-06-2026", savingsInr: null, status: "TODO" },
  { id: "t7", title: "Review EPI vs benchmark (28.4 vs 18)", building: "CoolChain Cold Storage", source: "AUDIT", priority: "LOW", assignee: "S. Nair", due: "05-07-2026", savingsInr: null, status: "TODO" },
  { id: "t8", title: "Verify corrected meter multiplying factor", building: "Acme Chakan Unit 2", source: "DIAGNOSIS", priority: "LOW", assignee: "R. Mehta", due: "28-06-2026", savingsInr: null, status: "DONE" },
  { id: "t9", title: "Submit net-metering application", building: "Orchid Tower (HQ)", source: "AUDIT", priority: "LOW", assignee: "A. Iyer", due: "01-06-2026", savingsInr: 540000, status: "DONE" },
] as const;

const ALERT_RULES = [
  { id: "r1", name: "Low power factor", condition: "PF < 0.90", severity: "CRITICAL", active: true },
  { id: "r2", name: "Demand near contract", condition: "Max demand > 90% of contract demand", severity: "WARNING", active: true },
  { id: "r3", name: "Bill anomaly", condition: "Bill > 15% above weather-normalised forecast", severity: "WARNING", active: true },
  { id: "r4", name: "EPI deviation", condition: "EPI > 10% above peer benchmark", severity: "WARNING", active: true },
  { id: "r5", name: "Missing bill", condition: "No bill received past due date", severity: "INFO", active: true },
  { id: "r6", name: "Meter offline", condition: "No reading for > 4 hours", severity: "INFO", active: false },
] as const;

const ALERTS = [
  { id: "a1", title: "Power factor below 0.90", building: "CoolChain Cold Storage", detail: "PF 0.88 vs 0.90 threshold — penalty accruing", severity: "CRITICAL", triggered: "06-06-2026", status: "NEW" },
  { id: "a2", title: "Maximum demand above 90% of contract", building: "Riverside Mall", detail: "MD 2,300 kVA vs 2,500 kVA contract (92%)", severity: "WARNING", triggered: "05-06-2026", status: "NEW" },
  { id: "a3", title: "Bill 23% above forecast", building: "TechPark Block C", detail: "₹36.8L vs ₹29.9L expected for May", severity: "WARNING", triggered: "04-06-2026", status: "ACKNOWLEDGED" },
  { id: "a4", title: "EPI above benchmark", building: "CoolChain Cold Storage", detail: "28.4 kWh/ft² vs 18 benchmark for cold storage", severity: "WARNING", triggered: "02-06-2026", status: "ACKNOWLEDGED" },
  { id: "a5", title: "Bill not received", building: "Riverside Mall", detail: "May 2026 bill missing past due date", severity: "INFO", triggered: "03-06-2026", status: "NEW" },
  { id: "a6", title: "Meter offline", building: "Orchid Tower (HQ)", detail: "No reading received for 6 hours", severity: "INFO", triggered: "01-06-2026", status: "RESOLVED" },
] as const;

/** Parse DD-MM-YYYY → UTC Date. */
function ddmmyyyy(s: string): Date {
  const [dd, mm, yy] = s.split("-").map(Number);
  return new Date(Date.UTC(yy, mm - 1, dd));
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SELECT set_config('app.current_org', $1, true)", DEMO_ORG_ID);

    await tx.organisation.upsert({
      where: { id: DEMO_ORG_ID },
      update: {},
      create: { id: DEMO_ORG_ID, name: "Acme Industries", gstin: "27ABCDE1234F1Z5", plan: "PRO" },
    });

    const slugIds = BUILDINGS.map((b) => b.id);

    // Prune legacy buildings (e.g. earlier deploys' uuid rows) + their bills.
    const legacy = await tx.building.findMany({ where: { id: { notIn: slugIds } } });
    for (const b of legacy) {
      const bills = await tx.electricityBill.findMany({ where: { buildingId: b.id }, select: { id: true } });
      for (const bill of bills) {
        const dg = await tx.diagnosis.findUnique({ where: { billId: bill.id } });
        if (dg) {
          await tx.lossFinding.deleteMany({ where: { diagnosisId: dg.id } });
          await tx.diagnosis.delete({ where: { id: dg.id } });
        }
      }
      await tx.electricityBill.deleteMany({ where: { buildingId: b.id } });
      await tx.building.delete({ where: { id: b.id } });
    }

    // Upsert the demo buildings (backfills new columns on existing rows).
    for (const b of BUILDINGS) {
      const { id, ...rest } = b;
      await tx.building.upsert({
        where: { id },
        update: { ...rest, trendL: [...rest.trendL] },
        create: { id, orgId: DEMO_ORG_ID, ...rest, trendL: [...rest.trendL] },
      });
    }

    // Tasks.
    for (const t of TASKS) {
      const { id, ...rest } = t;
      await tx.task.upsert({
        where: { id },
        update: { ...rest },
        create: { id, orgId: DEMO_ORG_ID, ...rest },
      });
    }

    // Alert rules.
    for (const r of ALERT_RULES) {
      const { id, ...rest } = r;
      await tx.alertRule.upsert({
        where: { id },
        update: { ...rest },
        create: { id, orgId: DEMO_ORG_ID, ...rest },
      });
    }

    // Alert instances.
    for (const a of ALERTS) {
      const { id, triggered, ...rest } = a;
      await tx.alertInstance.upsert({
        where: { id },
        update: { ...rest, triggered: ddmmyyyy(triggered) },
        create: { id, orgId: DEMO_ORG_ID, ...rest, triggered: ddmmyyyy(triggered) },
      });
    }

    // Ensure one sample bill (linked to Acme Bhosari).
    const sample = await tx.electricityBill.findFirst({ where: { consumerNumber: "0123456789" } });
    if (!sample) {
      await tx.electricityBill.create({
        data: {
          orgId: DEMO_ORG_ID,
          buildingId: "acme-bhosari",
          consumerNumber: "0123456789",
          consumerName: "Acme Manufacturing Pvt Ltd",
          discom: "MSEDCL",
          tariffCategory: "HT-I (Industrial)",
          supplyVoltage: "HT (22 kV)",
          contractDemandKva: 1000,
          billingDemandKva: 750,
          maxDemandKva: 720,
          energyKwh: 428000,
          apparentKvah: 470300,
          powerFactor: 0.91,
          pfPenaltyAmt: 48200,
          fixedDemandCharges: 337500,
          energyCharges: 3255000,
          todPeakKwh: 128400,
          todOffPeakKwh: 171200,
          todPeakRate: 9.5,
          todOffPeakRate: 5.9,
          totalAmountDue: 4484210,
          billDate: "02-06-2026",
          billingPeriodDays: 31,
        },
      });
    }

    // Payment / due-date tracking demo: a spread of bills across all buildings
    // with due dates relative to *now*, in mixed states (overdue / due-soon /
    // upcoming / paid-on-time / paid-late). Stable ids → idempotent re-seed, and
    // due dates recompute on each deploy so the demo stays current.
    const today = new Date();
    const addDays = (base: Date, n: number) => new Date(base.getTime() + n * 86_400_000);
    const fmt = (d: Date) =>
      `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
    // due = days from today; paid = days from dueOn (null = still unpaid).
    const PAY_PLAN: { due: number; paid: number | null }[] = [
      { due: -28, paid: null }, // overdue
      { due: -9, paid: null }, // overdue
      { due: 5, paid: null }, // due soon
      { due: 19, paid: null }, // upcoming
      { due: -44, paid: -3 }, // paid on time
      { due: -61, paid: 6 }, // paid late
    ];
    let payCount = 0;
    for (const b of BUILDINGS) {
      const baseAmt = (b.contractDemandKva ?? 600) * 1500;
      for (let i = 0; i < PAY_PLAN.length; i++) {
        const p = PAY_PLAN[i];
        const dueOn = addDays(today, p.due);
        const paidAt = p.paid === null ? null : addDays(dueOn, p.paid);
        const amount = Math.round(baseAmt * (0.85 + ((i * 7) % 30) / 100));
        const id = `pay-${b.id}-${i}`;
        const common = {
          buildingId: b.id,
          consumerName: b.name,
          discom: b.discom,
          totalAmountDue: amount,
          dueDate: fmt(dueOn),
          dueOn,
          paidAt,
          paidAmount: paidAt ? amount : null,
          billDate: fmt(addDays(dueOn, -20)),
        };
        await tx.electricityBill.upsert({
          where: { id },
          update: common,
          create: { id, orgId: DEMO_ORG_ID, ...common },
        });
        payCount += 1;
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Seed: ${BUILDINGS.length} buildings, ${payCount} tracked bills, ${legacy.length} legacy pruned.`);
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
