"use client";

import * as React from "react";
import { MapPin, Banknote, Smartphone, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SyncStatus } from "@/components/field/sync-status";
import { StatCard } from "@/components/app/stat-card";
import { COLLECTION_STOPS, type Stop } from "@/lib/mock/field";
import { formatRupees, formatRupeesCompact } from "@/lib/format";

export function CollectionRoute() {
  const [stops, setStops] = React.useState<Stop[]>(() =>
    COLLECTION_STOPS.map((s) => ({ ...s })),
  );

  const collect = (id: string) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, status: "collected" } : s)));

  const collected = stops.filter((s) => s.status === "collected");
  const pending = stops.filter((s) => s.status === "pending");
  const collectedAmt = collected.reduce((s, x) => s + x.amountINR, 0);
  const pendingAmt = pending.reduce((s, x) => s + x.amountINR, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Collection route</h1>
        <p className="text-sm text-muted-foreground">Bhosari MIDC · 6 stops · optimised order</p>
      </div>

      <SyncStatus pending={collected.length} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Collected" value={formatRupeesCompact(collectedAmt)} icon={Check} tone="success" />
        <StatCard label="Pending" value={formatRupeesCompact(pendingAmt)} icon={Banknote} tone={pendingAmt > 0 ? "warning" : "default"} />
      </div>

      <div className="space-y-3">
        {stops.map((s) => (
          <Card key={s.id} className={cn(s.status === "collected" && "opacity-70")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {s.seq}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{s.consumer}</span>
                    <span className="shrink-0 font-semibold">{formatRupees(s.amountINR)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {s.address} · {s.distanceKm} km
                  </div>

                  {s.status === "collected" ? (
                    <Badge variant="success" className="mt-2">
                      <Check className="mr-1 h-3 w-3" /> Collected
                    </Badge>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => collect(s.id)}>
                        <Banknote className="h-4 w-4" /> Cash
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => collect(s.id)}>
                        <Smartphone className="h-4 w-4" /> UPI
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
