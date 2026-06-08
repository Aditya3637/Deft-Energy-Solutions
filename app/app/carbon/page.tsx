import { Leaf } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";

export const metadata = { title: "Carbon" };

export default function CarbonPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Carbon" description="GHG inventory, BRSR and the carbon market." />
      <EmptyState
        icon={Leaf}
        title="Carbon module arrives in Stage B6"
        description="Scope 1/2/3 inventory auto-calculated from bills, diesel and refrigerant logs, plus IEX and BRSR reporting."
      />
    </div>
  );
}
