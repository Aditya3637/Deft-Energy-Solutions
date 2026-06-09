import Link from "next/link";
import { ArrowRight, TrendingDown, Scissors, ArrowLeftRight, BatteryCharging, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupeesCompact } from "@/lib/format";
import type { Rung, RungKey, SavingsStack as Stack } from "@/lib/savings-stack";

const RUNG_ICON: Record<RungKey, LucideIcon> = {
  recover: TrendingDown,
  reduce: Scissors,
  reprice: ArrowLeftRight,
  generate: BatteryCharging,
  earn: Coins,
};

const STATE_BADGE: Record<Rung["state"], { label: string; variant: "success" | "secondary" | "warning" }> = {
  live: { label: "Identified", variant: "success" },
  potential: { label: "Potential", variant: "secondary" },
  "needs-data": { label: "Unlock", variant: "warning" },
};

function RungRow({ rung, maxINR }: { rung: Rung; maxINR: number }) {
  const Icon = RUNG_ICON[rung.key];
  const badge = STATE_BADGE[rung.state];
  const value = rung.annualINR ?? 0;
  const pct = rung.state === "needs-data" ? 0 : Math.max(2, Math.round((value / maxINR) * 100));
  const tone = rung.state === "live" ? "bg-primary" : rung.state === "potential" ? "bg-muted-foreground/40" : "bg-muted";

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{rung.title}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{rung.blurb}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold tabular-nums">
          {rung.annualINR == null ? "—" : `${formatRupeesCompact(value)}`}
          {rung.annualINR != null && <span className="text-xs font-normal text-muted-foreground">/yr</span>}
        </div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Link href={rung.href}>
            {rung.state === "needs-data" ? "Unlock" : "Open"} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
      {/* contribution bar spans full width under the row */}
      <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SavingsStackView({ stack }: { stack: Stack }) {
  return (
    <div className="space-y-6">
      {/* Headline money story */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingDown className="h-4 w-4" /> Across every lever, we can move
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-4xl font-semibold tracking-tight">
              {formatRupeesCompact(stack.identifiedAnnualINR)}
              <span className="text-lg font-normal text-muted-foreground"> /year</span>
            </span>
            {stack.spendINR > 0 && (
              <span className="text-sm text-muted-foreground">
                on your {formatRupeesCompact(stack.spendINR)}/yr spend ·{" "}
                <span className="font-medium text-foreground">{stack.pctOfSpend}%</span>
              </span>
            )}
          </div>
          {stack.potentialAnnualINR > 0 && (
            <p className="mt-2 text-sm font-medium text-foreground">
              + up to {formatRupeesCompact(stack.potentialAnnualINR)} more in carbon, credits & cashback (potential)
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Identified = the levers we can quantify from your data today. Each rung below links to where you act on it.
          </p>
        </CardContent>
      </Card>

      {/* The lever ladder */}
      <Card>
        <CardHeader>
          <CardTitle>The savings stack</CardTitle>
          <CardDescription>How every rupee is recovered, repriced, generated or earned — lever by lever.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {stack.rungs.map((rung) => (
            <RungRow key={rung.key} rung={rung} maxINR={stack.maxRungINR} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
