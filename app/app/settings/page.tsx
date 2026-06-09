import { PageHeader } from "@/components/app/page-header";
import { SettingsView } from "@/components/app/settings-view";
import { PrivacyDataPanel } from "@/components/app/privacy-data-panel";
import { PlanBillingPanel } from "@/components/app/plan-billing-panel";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organisation, plan, language, notifications and your data." />
      <SettingsView />
      <PlanBillingPanel />
      <PrivacyDataPanel />
    </div>
  );
}
