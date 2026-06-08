"use client";

import * as React from "react";
import { Camera, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncStatus } from "@/components/field/sync-status";
import {
  AUDIT_META,
  AUDIT_SECTIONS,
  AUDIT_MEASUREMENTS,
} from "@/lib/mock/field";

export function AuditCapture() {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [photos, setPhotos] = React.useState(0);
  const [location, setLocation] = React.useState<string | null>(null);

  const filled = AUDIT_MEASUREMENTS.filter((m) => (values[m.id] ?? "").trim() !== "").length;
  const total = AUDIT_MEASUREMENTS.length;

  const setValue = (id: string, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">On-site audit</h1>
        <p className="text-sm text-muted-foreground">
          {AUDIT_META.building} · {AUDIT_META.auditor} · {AUDIT_META.date}
        </p>
      </div>

      <SyncStatus pending={3} />

      {/* Progress */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(filled / total) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums">
            {filled}/{total}
          </span>
        </CardContent>
      </Card>

      {AUDIT_SECTIONS.map((section) => {
        const ms = AUDIT_MEASUREMENTS.filter((m) => m.section === section);
        return (
          <Card key={section}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ms.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Label htmlFor={m.id} className="flex-1 text-muted-foreground">
                    {m.label}
                    {m.unit ? <span className="ml-1 text-xs">({m.unit})</span> : null}
                  </Label>
                  <Input
                    id={m.id}
                    type="number"
                    inputMode="decimal"
                    className="w-28"
                    placeholder="—"
                    value={values[m.id] ?? ""}
                    onChange={(e) => setValue(m.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setPhotos((p) => p + 1)}>
          <Camera className="h-4 w-4" />
          {photos > 0 ? `${photos} photo${photos === 1 ? "" : "s"}` : "Add photo"}
        </Button>
        <Button variant="outline" onClick={() => setLocation("18.6298° N, 73.8470° E")}>
          <MapPin className="h-4 w-4" />
          {location ? "Location set" : "Capture GPS"}
        </Button>
      </div>

      <Button className="w-full" size="lg">
        Save audit ({filled}/{total} captured)
      </Button>
      <p className="pb-2 text-center text-xs text-muted-foreground">
        Saved on device — syncs to the report builder when back online.
      </p>
    </div>
  );
}
