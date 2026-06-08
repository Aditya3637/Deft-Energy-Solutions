import { ListChecks } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";

export const metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Actions auto-created from diagnoses, alerts and audits." />
      <EmptyState
        icon={ListChecks}
        title="Task manager arrives in Stage B3"
        description="Diagnoses and alerts will spin up assignable tasks here, with Kanban and list views."
        action={{ label: "Analyze a bill", href: "/analyze" }}
      />
    </div>
  );
}
