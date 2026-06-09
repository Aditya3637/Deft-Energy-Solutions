import { GraduationCap, CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { api } from "@/lib/api";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  const COURSES = await api.ecosystem.courses();
  const completed = COURSES.filter((c) => c.progressPct === 100).length;
  const inProgress = COURSES.filter((c) => c.progressPct > 0 && c.progressPct < 100).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Training academy" description="Short, practical courses for energy and facility teams." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={String(COURSES.length)} icon={GraduationCap} />
        <StatCard label="In progress" value={String(inProgress)} icon={GraduationCap} tone="warning" />
        <StatCard label="Completed" value={String(completed)} icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {COURSES.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{c.title}</CardTitle>
                {c.progressPct === 100 && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{c.category}</Badge>
                <Badge variant="outline">{c.level}</Badge>
                <span className="text-xs text-muted-foreground">{c.hours} h</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${c.progressPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.progressPct}% complete</span>
                <Button variant="outline" size="sm">
                  {c.progressPct === 0 ? "Start" : c.progressPct === 100 ? "Review" : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
