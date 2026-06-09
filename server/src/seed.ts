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

    // eslint-disable-next-line no-console
    console.log(`Seed: ${BUILDINGS.length} buildings upserted, ${legacy.length} legacy pruned.`);
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
