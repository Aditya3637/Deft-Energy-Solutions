"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/field/sync-status";
import { type WorkOrder, type WoStatus, type WoPriority } from "@/lib/api/field";

const statusLabel: Record<WoStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};
const statusVariant: Record<WoStatus, "secondary" | "warning" | "success"> = {
  open: "secondary",
  in_progress: "warning",
  done: "success",
};
const priorityVariant: Record<WoPriority, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export function WorkOrdersList({ workOrders }: { workOrders: WorkOrder[] }) {
  return (
    <div className="space-y-4">
      <SyncStatus pending={1} />
      <div className="space-y-3">
        {workOrders.map((w) => {
          const progress = w.checklist.filter((c) => c.done).length;
          return (
            <Link key={w.id} href={`/field/work-orders/${w.id}`}>
              <Card className="transition-colors active:bg-muted/50">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{w.title}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {w.asset} · {w.building}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusVariant[w.status]}>{statusLabel[w.status]}</Badge>
                      <Badge variant={priorityVariant[w.priority]} className="capitalize">
                        {w.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {progress}/{w.checklist.length} checks · due {w.due}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
