"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ListChecks, Clock, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TASKS,
  TASK_COLUMNS,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/mock/tasks";
import { formatRupeesCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/app/stat-card";

const ORDER: TaskStatus[] = ["todo", "in_progress", "done"];
const priorityVariant: Record<TaskPriority, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};
const sourceVariant = { Diagnosis: "default", Alert: "warning", Audit: "secondary" } as const;

export function TasksBoard() {
  const [tasks, setTasks] = React.useState<Task[]>(() => TASKS.map((t) => ({ ...t })));

  const move = (id: string, dir: 1 | -1) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = Math.min(2, Math.max(0, ORDER.indexOf(t.status) + dir));
        return { ...t, status: ORDER[idx] };
      }),
    );

  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  const openSavings = tasks
    .filter((t) => t.status !== "done" && t.savingsINR)
    .reduce((s, t) => s + (t.savingsINR ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="To do" value={String(count("todo"))} icon={ListChecks} />
        <StatCard label="In progress" value={String(count("in_progress"))} icon={Clock} />
        <StatCard label="Done" value={String(count("done"))} icon={CheckCircle2} tone="success" />
        <StatCard label="Open savings" value={`${formatRupeesCompact(openSavings)}/yr`} icon={ListChecks} tone="success" />
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        {/* Kanban */}
        <TabsContent value="board">
          <div className="grid gap-4 lg:grid-cols-3">
            {TASK_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                        Nothing here
                      </p>
                    ) : (
                      colTasks.map((t) => (
                        <Card key={t.id}>
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug">{t.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{t.building}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant={priorityVariant[t.priority]} className="capitalize">
                                {t.priority}
                              </Badge>
                              <Badge variant={sourceVariant[t.source]}>{t.source}</Badge>
                              {t.savingsINR ? (
                                <span className="text-xs font-medium text-primary">
                                  {formatRupeesCompact(t.savingsINR)}/yr
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-muted-foreground">
                                {t.assignee} · due {t.due}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label="Move back"
                                  disabled={t.status === "todo"}
                                  onClick={() => move(t.id, -1)}
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label="Move forward"
                                  disabled={t.status === "done"}
                                  onClick={() => move(t.id, 1)}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* List */}
        <TabsContent value="list">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Task</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pl-4 font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.building}</TableCell>
                    <TableCell>
                      <Badge variant={sourceVariant[t.source]}>{t.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[t.priority]} className="capitalize">
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.due}</TableCell>
                    <TableCell className="pr-4">
                      <span
                        className={cn(
                          "text-sm",
                          t.status === "done" && "text-success",
                        )}
                      >
                        {TASK_COLUMNS.find((c) => c.key === t.status)?.label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
