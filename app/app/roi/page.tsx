import { PageHeader } from "@/components/app/page-header";
import { RoiCalculator } from "@/components/app/roi-calculator";

export const metadata = { title: "ROI calculator" };

export default function RoiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ROI calculator"
        description="Payback, IRR and NPV for any efficiency measure — prefilled from your recommendations."
      />
      <RoiCalculator />
    </div>
  );
}
