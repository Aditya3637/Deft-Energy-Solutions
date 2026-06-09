import Link from "next/link";
import { IndianRupee, TrendingDown, Building2, FileText, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { api, MONTHS } from "@/lib/api";
import { formatRupeesCompact } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [t, monthly, buildings, analyzed] = await Promise.all([
    api.portfolio.totals(),
    api.portfolio.monthly(),
    api.portfolio.buildings(),
    api.bills.listAnalyzed(),
  ]);
  const topBuildings = [...buildings]
    .sort((a, b) => b.savingsINR - a.savingsINR)
    .slice(0, 3);
  const billsPending = t.billsExpected - t.billsReceived;
  const recoverableFound = analyzed.reduce((s, b) => s + (b.recoverableInr ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Portfolio overview across all sites."
        action={{ label: "Analyze a bill", href: "/analyze" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly spend"
          value={formatRupeesCompact(t.monthlySpendINR)}
          hint={`${formatRupeesCompact(t.annualSpendINR)} trailing 12 months`}
          icon={IndianRupee}
        />
        <StatCard
          label="Identified savings"
          value={`${formatRupeesCompact(t.savingsINR)}/yr`}
          hint="across all opportunities"
          icon={TrendingDown}
          tone="success"
        />
        <StatCard
          label="Buildings"
          value={String(t.buildings)}
          hint="3 industrial · 3 commercial"
          icon={Building2}
        />
        <StatCard
          label="Bills tracked"
          value={`${t.billsReceived}/${t.billsExpected}`}
          hint={billsPending > 0 ? `${billsPending} pending this year` : "all received"}
          icon={FileText}
          tone={billsPending > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your analyzed bills</CardTitle>
          <CardDescription>
            Bills you&rsquo;ve analyzed and the savings we found
            {recoverableFound > 0 ? ` — ${formatRupeesCompact(recoverableFound)}/yr recoverable so far.` : "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {analyzed.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">No analyzed bills yet — upload one to see your savings.</p>
              <Link href="/analyze" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Analyze a bill <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            analyzed.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href="/app/bills"
                className="flex items-center justify-between gap-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{b.title}</div>
                  <div className="text-sm text-muted-foreground">{b.discom} · {b.month}</div>
                </div>
                <span className="shrink-0 font-semibold text-primary">
                  {b.recoverableInr ? `${formatRupeesCompact(b.recoverableInr)}/yr` : "—"}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly spend</CardTitle>
          <CardDescription>Portfolio total, ₹ lakh — last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            caption="Portfolio monthly spend in lakh rupees over the last 12 months"
            data={monthly.map((v, i) => ({ label: MONTHS[i], value: v }))}
            format={(n) => `${n}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top opportunities</CardTitle>
          <CardDescription>Buildings ranked by identified savings.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {topBuildings.map((b) => (
            <Link
              key={b.id}
              href={`/app/buildings/${b.id}`}
              className="flex items-center justify-between gap-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/40"
            >
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-sm text-muted-foreground">
                  {b.city} · {b.discom}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={b.pf < 0.9 ? "warning" : "secondary"}>
                  PF {b.pf.toFixed(2)}
                </Badge>
                <span className="font-semibold text-primary">
                  {formatRupeesCompact(b.savingsINR)}/yr
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
