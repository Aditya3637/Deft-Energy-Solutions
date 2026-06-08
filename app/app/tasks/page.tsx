import { PageHeader } from "@/components/app/page-header";
import { TasksBoard } from "@/components/app/tasks-board";

export const metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Actions auto-created from diagnoses, alerts and audits."
        action={{ label: "Analyze a bill", href: "/analyze" }}
      />
      <TasksBoard />
    </div>
  );
}
