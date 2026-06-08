import { Bell } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Threshold and anomaly alerts across the portfolio." />
      <EmptyState
        icon={Bell}
        title="Alert engine arrives in Stage B3"
        description="Rules like PF below 0.90 or max demand above 90% of contract demand will trigger alerts and escalations here."
      />
    </div>
  );
}
