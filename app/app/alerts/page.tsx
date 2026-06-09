import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { AlertsView } from "@/components/app/alerts-view";

export const metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const [alerts, rules] = await Promise.all([api.alerts.list(), api.alerts.rules()]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Threshold and anomaly alerts across the portfolio."
      />
      <AlertsView initialAlerts={alerts} initialRules={rules} />
    </div>
  );
}
