import { Settings } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organisation, members, notifications and data." />
      <EmptyState
        icon={Settings}
        title="Settings arrive in a later stage"
        description="Organisation profile, team roles, notification preferences and DPDP data controls will live here."
      />
    </div>
  );
}
