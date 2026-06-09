"use client";

import Link from "next/link";
import { Wrench, ClipboardCheck, Wallet, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/field/sync-status";
import type { WorkOrder, Stop } from "@/lib/api/field";
import { formatRupeesCompact } from "@/lib/format";

export function FieldHome({
  workOrders,
  stops,
}: {
  workOrders: WorkOrder[];
  stops: Stop[];
}) {
  const openWo = workOrders.filter((w) => w.status !== "done").length;
  const pendingStops = stops.filter((s) => s.status === "pending");
  const toCollect = pendingStops.reduce((s, x) => s + x.amountINR, 0);

  const tiles: {
    href: string;
    icon: LucideIcon;
    label: string;
    value: string;
    hint: string;
  }[] = [
    { href: "/field/work-orders", icon: Wrench, label: "Work orders", value: String(openWo), hint: "open today" },
    { href: "/field/audit", icon: ClipboardCheck, label: "Audit", value: "1", hint: "in progress" },
    { href: "/field/collection", icon: Wallet, label: "Collection", value: `${pendingStops.length}`, hint: `${formatRupeesCompact(toCollect)} due` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Good morning, S. Nair</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your day at Bhosari MIDC.</p>
      </div>

      <SyncStatus pending={2} />

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{t.value}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {t.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Up next</h2>
        <Card>
          <CardContent className="divide-y p-0">
            {workOrders
              .filter((w) => w.status !== "done")
              .slice(0, 3)
              .map((w) => (
                <Link
                  key={w.id}
                  href={`/field/work-orders/${w.id}`}
                  className="flex items-center justify-between gap-3 p-3 transition-colors active:bg-muted/50"
                >
                  <div>
                    <div className="text-sm font-medium">{w.title}</div>
                    <div className="text-xs text-muted-foreground">{w.building}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={w.priority === "high" ? "destructive" : "secondary"} className="capitalize">
                      {w.priority}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
