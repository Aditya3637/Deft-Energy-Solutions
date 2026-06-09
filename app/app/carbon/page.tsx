import Link from "next/link";
import { Leaf, Factory, Zap, Truck, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { api } from "@/lib/api";
import { formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Carbon" };

const scopeIcon = [Factory, Zap, Truck];

export default async function CarbonPage() {
  const GHG_SCOPES = await api.markets.ghgScopes();
  const total = GHG_SCOPES.reduce((s, sc) => s + sc.tco2e, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carbon"
        description="GHG inventory (Scope 1/2/3). Markets & credits live under Markets."
        action={{ label: "Open markets", href: "/app/markets" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total footprint" value={`${formatIndianNumber(total)} tCO₂e`} hint="this year" icon={Leaf} />
        {GHG_SCOPES.map((sc, i) => (
          <StatCard
            key={sc.scope}
            label={sc.scope}
            value={`${formatIndianNumber(sc.tco2e)}`}
            hint={`${Math.round((sc.tco2e / total) * 100)}% · tCO₂e`}
            icon={scopeIcon[i] ?? Leaf}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emissions by scope</CardTitle>
          <CardDescription>tCO₂e — GHG Protocol.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            caption="Emissions by scope"
            data={GHG_SCOPES.map((sc) => ({ label: sc.scope, value: sc.tco2e }))}
            format={(n) => formatIndianNumber(n)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {GHG_SCOPES.map((sc) => (
          <Card key={sc.scope}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{sc.scope}</CardTitle>
                {sc.scope === "Scope 2" && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" /> auto
                  </Badge>
                )}
              </div>
              <CardDescription>{sc.note}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {sc.sources.map((src) => (
                <div key={src.name} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                  <span className="text-muted-foreground">{src.name}</span>
                  <span className="font-medium tabular-nums">{formatIndianNumber(src.tco2e)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Monetise reductions</h3>
            <p className="text-sm text-muted-foreground">Track CCTS carbon credits and the IEX market.</p>
          </div>
          <Button asChild>
            <Link href="/app/markets">Open markets</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
