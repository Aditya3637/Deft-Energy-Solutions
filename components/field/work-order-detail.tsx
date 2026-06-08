"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, MapPin, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SyncStatus } from "@/components/field/sync-status";
import type { WorkOrder } from "@/lib/mock/field";

export function WorkOrderDetail({ wo }: { wo: WorkOrder }) {
  const [items, setItems] = React.useState(() => wo.checklist.map((c) => ({ ...c })));
  const [photos, setPhotos] = React.useState(0);
  const [location, setLocation] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState(wo.status === "done");

  const doneCount = items.filter((c) => c.done).length;
  const allDone = doneCount === items.length;

  const toggle = (id: string) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/field/work-orders">
          <ArrowLeft className="h-4 w-4" /> Work orders
        </Link>
      </Button>

      <SyncStatus pending={1} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{wo.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {wo.asset} · {wo.building}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{wo.type}</Badge>
            <Badge variant={wo.priority === "high" ? "destructive" : "warning"} className="capitalize">
              {wo.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">Due {wo.due}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checklist */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                Checklist ({doneCount}/{items.length})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(doneCount / items.length) * 100}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={c.done}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        c.done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {c.done && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={cn(c.done && "text-muted-foreground line-through")}>
                      {c.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Evidence capture */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setPhotos((p) => p + 1)}>
              <Camera className="h-4 w-4" />
              {photos > 0 ? `${photos} photo${photos === 1 ? "" : "s"}` : "Add photo"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("18.6298° N, 73.8470° E")}
            >
              <MapPin className="h-4 w-4" />
              {location ? "Location set" : "Capture GPS"}
            </Button>
          </div>
          {location && (
            <p className="text-xs text-muted-foreground">Tagged at {location}</p>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={!allDone || completed}
        onClick={() => setCompleted(true)}
      >
        {completed ? "Completed ✓" : allDone ? "Complete work order" : "Finish all checks to complete"}
      </Button>
    </div>
  );
}
