import { PageHeader } from "@/components/app/page-header";
import { AlertsView } from "@/components/app/alerts-view";

export const metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Threshold and anomaly alerts across the portfolio."
      />
      <AlertsView />
    </div>
  );
}
