import { BatteryCharging, IndianRupee, Clock, Gauge, Leaf, Zap, Radio } from "lucide-react";

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
import { api } from "@/lib/api";
import { formatRupeesCompact, formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Assets" };

export default async function AssetsPage() {
  const [BESS, MICROGRID, VPP] = await Promise.all([
    api.markets.bess(),
    api.markets.microgrid(),
    api.markets.vpp(),
  ]);
  const bessAnnual = BESS.demandSavingINR + BESS.arbitrageSavingINR;

  return (
    <div className="space-y-6">
      <PageHeader title="Assets" description="Distributed energy resources: storage, microgrid and VPP." />

      <Tabs defaultValue="bess">
        <TabsList>
          <TabsTrigger value="bess">BESS</TabsTrigger>
          <TabsTrigger value="microgrid">Microgrid</TabsTrigger>
          <TabsTrigger value="vpp">VPP</TabsTrigger>
        </TabsList>

        {/* BESS sizing */}
        <TabsContent value="bess" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Recommended size" value={`${BESS.recommendedKw} kW`} hint={`${formatIndianNumber(BESS.recommendedKwh)} kWh`} icon={BatteryCharging} />
            <StatCard label="Annual saving" value={`${formatRupeesCompact(bessAnnual)}/yr`} icon={IndianRupee} tone="success" />
            <StatCard label="CAPEX" value={formatRupeesCompact(BESS.capexINR)} icon={IndianRupee} />
            <StatCard label="Payback" value={`${BESS.paybackYrs} yr`} icon={Clock} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>How the saving splits</CardTitle>
              <CardDescription>Sized against a {formatIndianNumber(BESS.peakKw)} kW peak.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <div className="flex items-center justify-between py-2.5 text-sm first:pt-0">
                <span>Demand-charge reduction (peak shaving)</span>
                <span className="font-medium text-primary">{formatRupeesCompact(BESS.demandSavingINR)}/yr</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm last:pb-0">
                <span>Energy arbitrage (charge off-peak, discharge peak)</span>
                <span className="font-medium text-primary">{formatRupeesCompact(BESS.arbitrageSavingINR)}/yr</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Microgrid */}
        <TabsContent value="microgrid" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Islanding capability" value={`${MICROGRID.islandingHours} h`} hint="full backup" icon={Zap} />
            <StatCard label="Reliability" value={`${MICROGRID.reliabilityPct}%`} hint="uptime" icon={Gauge} tone="success" />
            <StatCard label="Renewable share" value={`${MICROGRID.renewableSharePct}%`} icon={Leaf} tone="success" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Microgrid components</CardTitle>
              <CardDescription>Solar + storage + DG + grid, in islanding mode.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {MICROGRID.components.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                  <span>{c.name}</span>
                  <Badge variant="secondary">{c.spec}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VPP */}
        <TabsContent value="vpp" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Dispatchable" value={`${formatIndianNumber(VPP.dispatchableKw)} kW`} hint={`${VPP.sites} sites aggregated`} icon={Radio} />
            <StatCard label="DR events YTD" value={String(VPP.drEventsYTD)} icon={Zap} />
            <StatCard label="DR revenue" value={`${formatRupeesCompact(VPP.drRevenueINR)}/yr`} icon={IndianRupee} tone="success" />
            <StatCard label="Sites" value={String(VPP.sites)} icon={Radio} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Aggregated resources</CardTitle>
              <CardDescription>Dispatched as a single virtual power plant.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {VPP.der.map((d) => (
                <div key={d.name} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                  <span>{d.name}</span>
                  <span className="font-medium tabular-nums">{formatIndianNumber(d.kw)} kW</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
