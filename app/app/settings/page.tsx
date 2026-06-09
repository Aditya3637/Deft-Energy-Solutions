import { PageHeader } from "@/components/app/page-header";
import { SettingsView } from "@/components/app/settings-view";
import { PrivacyDataPanel } from "@/components/app/privacy-data-panel";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organisation, language, notifications and your data." />
      <SettingsView />
      <PrivacyDataPanel />
    </div>
  );
}
