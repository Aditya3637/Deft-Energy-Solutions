import Link from "next/link";
import {
  IndianRupee,
  TrendingDown,
  Leaf,
  ShieldCheck,
  Target,
  AlertTriangle,
  Download,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/ui/demo-button";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { api, MONTHS } from "@/lib/api";
import { formatRupeesCompact, formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Executive summary" };

const severityVariant = { high: "destructive", medium: "warning", low: "secondary" } as const;

export default async function ExecutivePage() {
  const [t, monthly, CARBON_TOTAL, ESG, NET_ZERO, OBLIGATIONS, RISKS, EXEC_OPPORTUNITIES] =
    await Promise.all([
      api.portfolio.totals(),
      api.portfolio.monthly(),
      api.sustainability.carbonTotal(),
      api.sustainability.esg(),
      api.sustainability.netZero(),
      api.sustainability.obligations(),
      api.sustainability.risks(),
      api.sustainability.opportunities(),
    ]);
  const compliant = OBLIGATIONS.filter((o) => o.status === "compliant").length;
  const compliancePct = Math.round((compliant / OBLIGATIONS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Executive summary" description="Board-ready view across the portfolio." />
        <DemoButton
          variant="outline"
          toastTitle="Export queued"
          toastDescription="Board deck (PDF/PPT) generation ships with the backend at Stage G."
        >
          <Download className="h-4 w-4" /> Export deck
        </DemoButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Annual energy spend" value={formatRupeesCompact(t.annualSpendINR)} hint={`${t.buildings} sites`} icon={IndianRupee} />
        <StatCard label="Savings identified" value={`${formatRupeesCompact(t.savingsINR)}/yr`} hint="across all opportunities" icon={TrendingDown} tone="success" />
        <StatCard label="Carbon footprint" value={`${formatIndianNumber(CARBON_TOTAL)} tCO₂e`} hint="Scope 1+2+3" icon={Leaf} />
        <StatCard label="ESG score" value={`${ESG.overall}/100`} hint={ESG.percentile} icon={ShieldCheck} />
        <StatCard label="Net Zero progress" value={`${NET_ZERO.progressPct}%`} hint={`target ${NET_ZERO.targetYear}`} icon={Target} />
        <StatCard label="Compliance" value={`${compliancePct}%`} hint={`${compliant}/${OBLIGATIONS.length} obligations`} icon={ShieldCheck} tone={compliancePct < 80 ? "warning" : "success"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Energy spend trend</CardTitle>
          <CardDescription>Portfolio total, ₹ lakh — last 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart caption="Portfolio spend" data={monthly.map((v, i) => ({ label: MONTHS[i], value: v }))} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Top risks
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {RISKS.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm">{r.title}</span>
                <Badge variant={severityVariant[r.severity]} className="shrink-0 capitalize">{r.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-primary" /> Top opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {EXEC_OPPORTUNITIES.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm">{o.title}</span>
                <span className="shrink-0 font-semibold text-primary">{formatRupeesCompact(o.annualINR)}/yr</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Drill into the detail</h3>
            <p className="text-sm text-muted-foreground">Compliance scorecard, BRSR and ESG breakdown.</p>
          </div>
          <Button asChild>
            <Link href="/app/compliance">Open compliance</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
