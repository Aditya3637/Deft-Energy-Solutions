"use client";

import * as React from "react";
import { IndianRupee, Clock, Percent, PiggyBank } from "lucide-react";

import { computeRoi, ECM_PRESETS, type RoiInput } from "@/lib/finance";
import { formatRupees, formatRupeesCompact } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";

export function RoiCalculator() {
  const [input, setInput] = React.useState<RoiInput>({
    capex: 450000,
    annualSaving: 578400,
    years: 10,
    discountRatePct: 10,
    escalationPct: 5,
  });

  const set = (key: keyof RoiInput, value: string) =>
    setInput((prev) => ({ ...prev, [key]: Number(value) || 0 }));

  const r = React.useMemo(() => computeRoi(input), [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>Prefill from a recommended measure, then tweak.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ECM_PRESETS.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  setInput((prev) => ({ ...prev, capex: p.capex, annualSaving: p.annualSaving }))
                }
                title={p.note}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <Field id="capex" label="Project cost (CAPEX, ₹)" value={input.capex} onChange={(v) => set("capex", v)} />
          <Field id="annualSaving" label="Annual saving (₹)" value={input.annualSaving} onChange={(v) => set("annualSaving", v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field id="years" label="Life (yr)" value={input.years} onChange={(v) => set("years", v)} />
            <Field id="discount" label="Discount %" value={input.discountRatePct} onChange={(v) => set("discountRatePct", v)} />
            <Field id="escalation" label="Escalation %" value={input.escalationPct} onChange={(v) => set("escalationPct", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Simple payback"
            value={r.paybackYears != null ? `${r.paybackYears.toFixed(1)} yr` : "—"}
            icon={Clock}
            tone={r.paybackYears != null && r.paybackYears <= 3 ? "success" : "default"}
          />
          <StatCard
            label="IRR"
            value={r.irrPct != null ? `${r.irrPct.toFixed(1)}%` : "—"}
            icon={Percent}
            tone={r.irrPct != null && r.irrPct >= input.discountRatePct ? "success" : "default"}
          />
          <StatCard
            label={`NPV @ ${input.discountRatePct}%`}
            value={formatRupeesCompact(Math.round(r.npv))}
            icon={IndianRupee}
            tone={r.npv > 0 ? "success" : "warning"}
          />
          <StatCard
            label={`Lifetime savings (${input.years} yr)`}
            value={formatRupeesCompact(Math.round(r.lifetimeSavings))}
            icon={PiggyBank}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verdict</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {r.npv > 0
                ? `This measure is worth doing: it returns ${formatRupees(Math.round(r.npv))} in today's money over ${input.years} years`
                : `At a ${input.discountRatePct}% discount rate this measure does not pay back over ${input.years} years.`}
              {r.irrPct != null && r.npv > 0
                ? `, an IRR of ${r.irrPct.toFixed(1)}% against your ${input.discountRatePct}% hurdle.`
                : "."}
            </p>
            <p className="text-xs">
              Estimates only. Savings escalate {input.escalationPct}%/yr; full M&amp;V (IPMVP) confirms
              realised savings at Stage G.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
