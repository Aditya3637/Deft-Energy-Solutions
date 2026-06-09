import { PageHeader } from "@/components/app/page-header";
import { SavingsStackView } from "@/components/app/savings-stack";
import { api, oaEconomics } from "@/lib/api";
import { buildSavingsStack } from "@/lib/savings-stack";

export const metadata = { title: "Savings Stack" };

export default async function SavingsPage() {
  const [totals, oa, bess, credits, eff] = await Promise.all([
    api.portfolio.totals(),
    api.markets.openAccess(),
    api.markets.bess(),
    api.markets.carbonCredits(),
    api.efficiency.potential(),
  ]);
  const oaEcon = oaEconomics(oa);

  const stack = buildSavingsStack({
    annualSpendINR: totals.annualSpendINR,
    recoverableINR: totals.savingsINR, // portfolio-wide diagnosis savings (no-capex)
    efficiencyINR: eff.annualSavingInr, // ECM consumption-reduction potential
    oaEligible: oa.eligible,
    oaAnnualINR: oaEcon.annualINR,
    bessAnnualINR: bess.demandSavingINR + bess.arbitrageSavingINR,
    carbonValueINR: credits.held * credits.ccPriceINR,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Stack"
        description="Every lever Deft uses to move money on your electricity bill — quantified and totalled in one view."
      />
      <SavingsStackView stack={stack} />
    </div>
  );
}
