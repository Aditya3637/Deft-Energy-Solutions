import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const org = await prisma.organisation.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: { id: DEMO_ORG_ID, name: "Acme Industries", gstin: "27ABCDE1234F1Z5", plan: "PRO" },
  });

  const buildings = [
    { name: "Acme Bhosari Plant", city: "Pune", type: "INDUSTRIAL", discom: "MSEDCL", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 120000, sanctionedLoadKw: 850, contractDemandKva: 1000, pf: 0.91, epi: 14.2, savingsInr: 2767776 },
    { name: "Acme Chakan Unit 2", city: "Pune", type: "INDUSTRIAL", discom: "MSEDCL", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 95000, sanctionedLoadKw: 620, contractDemandKva: 750, pf: 0.96, epi: 11.8, savingsInr: 810000 },
    { name: "Orchid Tower (HQ)", city: "Mumbai", type: "COMMERCIAL", discom: "Adani Electricity", supplyVoltage: "HT (11 kV)", tariffCategory: "HT-II (Commercial)", areaSqft: 210000, sanctionedLoadKw: 1400, contractDemandKva: 1650, pf: 0.99, epi: 9.1, savingsInr: 540000 },
    { name: "CoolChain Cold Storage", city: "Chennai", type: "INDUSTRIAL", discom: "TANGEDCO", supplyVoltage: "HT (22 kV)", tariffCategory: "HT-I (Industrial)", areaSqft: 60000, sanctionedLoadKw: 720, contractDemandKva: 900, pf: 0.88, epi: 28.4, savingsInr: 2230000 },
  ] as const;

  for (const b of buildings) {
    await prisma.building.create({ data: { orgId: org.id, ...b } });
  }

  const firstBuilding = await prisma.building.findFirst({ where: { orgId: org.id } });
  await prisma.electricityBill.create({
    data: {
      orgId: org.id,
      buildingId: firstBuilding?.id,
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

  // eslint-disable-next-line no-console
  console.log("Seeded demo org, buildings and a sample bill.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
