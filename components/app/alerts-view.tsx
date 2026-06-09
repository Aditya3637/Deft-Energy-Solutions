"use client";

import * as React from "react";
import { Bell, BellRing, CheckCircle2, AlertTriangle, Info, AlertOctagon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type AlertInstance,
  type AlertRule,
  type AlertSeverity,
} from "@/lib/api/alerts";
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
import { EmptyState } from "@/components/states/empty-state";

const severityVariant: Record<AlertSeverity, "destructive" | "warning" | "secondary"> = {
  critical: "destructive",
  warning: "warning",
  info: "secondary",
};
const severityIcon = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
} as const;

export function AlertsView({
  initialAlerts,
  initialRules,
}: {
  initialAlerts: AlertInstance[];
  initialRules: AlertRule[];
}) {
  const [alerts, setAlerts] = React.useState<AlertInstance[]>(() =>
    initialAlerts.map((a) => ({ ...a })),
  );
  const [rules, setRules] = React.useState<AlertRule[]>(() =>
    initialRules.map((r) => ({ ...r })),
  );

  const setStatus = (id: string, status: AlertInstance["status"]) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  const toggleRule = (id: string) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));

  const active = alerts.filter((a) => a.status !== "resolved");
  const unacked = alerts.filter((a) => a.status === "new").length;
  const resolved = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active alerts" value={String(active.length)} icon={BellRing} tone={active.length ? "warning" : "default"} />
        <StatCard label="Unacknowledged" value={String(unacked)} icon={Bell} tone={unacked ? "warning" : "default"} />
        <StatCard label="Resolved" value={String(resolved)} icon={CheckCircle2} tone="success" />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active alerts</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {active.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All clear" description="No active alerts across the portfolio." />
          ) : (
            active.map((a) => {
              const Icon = severityIcon[a.severity];
              return (
                <Card key={a.id}>
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          a.severity === "critical" && "bg-destructive/10 text-destructive",
                          a.severity === "warning" && "bg-warning/10 text-warning",
                          a.severity === "info" && "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{a.title}</p>
                          <Badge variant={severityVariant[a.severity]} className="capitalize">
                            {a.severity}
                          </Badge>
                          {a.status === "acknowledged" && (
                            <Badge variant="outline">Acknowledged</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {a.building} · {a.detail}
                        </p>
                        <p className="text-xs text-muted-foreground">Triggered {a.triggered}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {a.status === "new" && (
                        <Button variant="outline" size="sm" onClick={() => setStatus(a.id, "acknowledged")}>
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setStatus(a.id, "resolved")}>
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="rules">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Rule</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="pr-4 text-right">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4 font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.condition}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[r.severity]} className="capitalize">
                        {r.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant={r.active ? "secondary" : "outline"}
                        size="sm"
                        aria-pressed={r.active}
                        onClick={() => toggleRule(r.id)}
                      >
                        {r.active ? "Active" : "Off"}
                      </Button>
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
