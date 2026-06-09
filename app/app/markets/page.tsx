import { Check, IndianRupee, Activity, Award, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { OA, oaEconomics, IEX, CARBON_CREDITS } from "@/lib/mock/energy-markets";
import { formatRupees, formatRupeesCompact, formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Markets" };

export default function MarketsPage() {
  const oa = oaEconomics();
  const creditValue = CARBON_CREDITS.held * CARBON_CREDITS.ccPriceINR;

  return (
    <div className="space-y-6">
      <PageHeader title="Markets" description="Open access, the power exchange, and carbon credits." />

      <Tabs defaultValue="oa">
        <TabsList>
          <TabsTrigger value="oa">Open access</TabsTrigger>
          <TabsTrigger value="iex">IEX market</TabsTrigger>
          <TabsTrigger value="carbon">Carbon credits</TabsTrigger>
        </TabsList>

        {/* Open access journey */}
        <TabsContent value="oa" className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 pt-6">
              {OA.steps.map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span
                    className={
                      i === 0
                        ? "rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {s}
                  </span>
                  {i < OA.steps.length - 1 && <span className="h-px w-4 bg-border" />}
                </span>
              ))}
              <Badge variant="success" className="ml-auto gap-1">
                <Check className="h-3 w-3" /> Eligible · {OA.loadKw} kW
              </Badge>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Net saving" value={`₹${oa.netPerUnit.toFixed(2)}/kWh`} hint={`vs ₹${OA.gridRateINR}/kWh grid`} icon={IndianRupee} tone="success" />
            <StatCard label="Annual saving" value={`${formatRupeesCompact(oa.annualINR)}/yr`} icon={TrendingUp} tone="success" />
            <StatCard label="OA landed cost" value={`₹${oa.landed.toFixed(2)}/kWh`} hint={`exchange ₹${OA.exchangeRateINR} + charges`} icon={Activity} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost build-up</CardTitle>
              <CardDescription>What you'd pay through open access, per kWh.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <Row label="Exchange / bilateral power" value={`₹${OA.exchangeRateINR.toFixed(2)}`} />
              {OA.charges.map((c) => (
                <Row key={c.name} label={c.name} value={`₹${c.rate.toFixed(2)}`} muted />
              ))}
              <Row label="Landed cost" value={`₹${oa.landed.toFixed(2)}`} bold />
              <Row label="Grid tariff (today)" value={`₹${OA.gridRateINR.toFixed(2)}`} />
              <Row label="Net saving" value={`₹${oa.netPerUnit.toFixed(2)}/kWh`} accent />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button title="SLDC NOC generation at Stage G">Generate SLDC NOC application</Button>
          </div>
        </TabsContent>

        {/* IEX market */}
        <TabsContent value="iex" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Last MCP" value={`₹${IEX.lastMcpINR.toFixed(2)}`} hint="market clearing price" icon={Activity} />
            <StatCard label="Day average" value={`₹${IEX.dayAvgINR.toFixed(2)}`} icon={IndianRupee} />
            <StatCard label="Peak" value={`₹${IEX.peakINR.toFixed(2)}`} hint="18:00–20:00" icon={TrendingUp} tone="warning" />
            <StatCard label="Off-peak" value={`₹${IEX.offPeakINR.toFixed(2)}`} icon={IndianRupee} tone="success" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Day-ahead price (DAM)</CardTitle>
              <CardDescription>₹/kWh by 2-hour block. Red blocks are above ₹6.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                caption="Day-ahead market price by block"
                data={IEX.blocks.map((b) => ({ label: b.h, value: b.p, tone: b.p > 6 ? "over" : "default" }))}
                format={(n) => `₹${n.toFixed(1)}`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carbon credits */}
        <TabsContent value="carbon" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Credits held" value={formatIndianNumber(CARBON_CREDITS.held)} hint="CCTS certificates" icon={Award} />
            <StatCard label="Portfolio value" value={formatRupeesCompact(creditValue)} hint={`@ ₹${CARBON_CREDITS.ccPriceINR}/CCC`} icon={IndianRupee} tone="success" />
            <StatCard label="Retired" value={formatIndianNumber(CARBON_CREDITS.retired)} hint="for compliance" icon={Check} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Credits by project</CardTitle>
              <CardDescription>Generated from efficiency & renewable measures.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {CARBON_CREDITS.projects.map((p) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                  <span>{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{p.credits} CCC</span>
                    <span className="font-medium text-primary">{formatRupees(p.credits * CARBON_CREDITS.ccPriceINR)}</span>
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

function Row({
  label,
  value,
  muted,
  bold,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
      <span className={muted ? "pl-3 text-muted-foreground" : ""}>{label}</span>
      <span className={accent ? "font-semibold text-primary" : bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
