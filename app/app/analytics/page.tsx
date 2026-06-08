import { IndianRupee, Target, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart, type BarDatum } from "@/components/charts/bar-chart";
import {
  BUILDINGS,
  MONTHS,
  BUDGET_L,
  forecastL,
  portfolioMonthlyL,
} from "@/lib/mock/portfolio";
import { formatRupeesCompact } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const monthly = portfolioMonthlyL();
  const forecast = forecastL();

  const forecastData: BarDatum[] = forecast.map((p) => ({
    label: p.label,
    value: p.value,
    tone: p.predicted ? "forecast" : "default",
  }));

  const budgetData: BarDatum[] = monthly.map((v, i) => ({
    label: MONTHS[i],
    value: v,
    tone: v > BUDGET_L ? "over" : "under",
  }));

  const ytdActual = monthly.reduce((s, v) => s + v, 0);
  const ytdBudget = BUDGET_L * monthly.length;
  const variance = ytdActual - ytdBudget;

  const nextMonth = forecast.find((p) => p.predicted);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Forecast, budget tracking and portfolio benchmarks." />

      <Tabs defaultValue="forecast">
        <TabsList>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="budget">Budget vs actual</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        {/* Forecast */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Next month (forecast)" value={`₹${nextMonth?.value ?? 0}L`} hint="Jul 2026" icon={TrendingUp} />
            <StatCard label="Trailing 12-mo spend" value={`₹${ytdActual.toFixed(0)}L`} icon={IndianRupee} />
            <StatCard label="Monthly budget" value={`₹${BUDGET_L}L`} icon={Target} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Spend forecast</CardTitle>
              <CardDescription>
                12 actual months + 3 projected (dashed), ₹ lakh. Projection blends
                trend and seasonality — refined by the ML service at Stage G.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart caption="Spend forecast in lakh rupees" data={forecastData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget vs actual */}
        <TabsContent value="budget" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="YTD budget" value={`₹${ytdBudget}L`} icon={Target} />
            <StatCard label="YTD actual" value={`₹${ytdActual.toFixed(0)}L`} icon={IndianRupee} />
            <StatCard
              label="Variance"
              value={`${variance >= 0 ? "+" : ""}₹${variance.toFixed(0)}L`}
              hint={variance >= 0 ? "over budget" : "under budget"}
              icon={TrendingUp}
              tone={variance > 0 ? "warning" : "success"}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Monthly spend vs ₹{BUDGET_L}L budget</CardTitle>
              <CardDescription>
                Red months ran over budget; green ran under.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart caption="Monthly spend versus budget" data={budgetData} />
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-success" /> Under budget
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-destructive" /> Over budget
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Performance Index by building</CardTitle>
              <CardDescription>kWh/ft²/year — lower is better.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                caption="EPI by building"
                height={180}
                data={BUILDINGS.map((b) => ({
                  label: b.city,
                  value: b.epi,
                  tone: b.epi > 15 ? "over" : "under",
                }))}
                format={(n) => n.toFixed(1)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Savings potential by building</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {[...BUILDINGS]
                .sort((a, b) => b.savingsINR - a.savingsINR)
                .map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <span className="text-sm">{b.name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant={b.epi > 15 ? "warning" : "secondary"}>
                        EPI {b.epi}
                      </Badge>
                      <span className="font-semibold text-primary">
                        {formatRupeesCompact(b.savingsINR)}/yr
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
