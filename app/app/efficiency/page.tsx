import { Scissors, Zap, IndianRupee, Percent } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { api } from "@/lib/api";
import { formatRupees, formatRupeesCompact, formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Efficiency" };

export default async function EfficiencyPage() {
  const e = await api.efficiency.potential();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Efficiency"
        description="Cut the consumption itself — energy-conservation measures sized to your load. Estimates, capex-led."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annual saving potential" value={`${formatRupeesCompact(e.annualSavingInr)}/yr`} icon={IndianRupee} tone="success" />
        <StatCard label="Energy saved" value={`${formatIndianNumber(e.annualKwhSaved)} kWh`} hint="per year" icon={Zap} />
        <StatCard label="Of consumption" value={`${e.pctOfConsumption}%`} hint={`${formatIndianNumber(e.totalKwh)} kWh/yr total`} icon={Percent} />
        <StatCard label="Measures" value={String(e.measures.length)} icon={Scissors} />
      </div>

      {e.measures.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Saving by measure</CardTitle>
              <CardDescription>Estimated ₹/yr — ranked by impact. Based on your consumption mix at ₹{e.blendedRateInr}/kWh.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                caption="Annual saving by measure"
                data={e.measures.map((m) => ({ label: m.category, value: m.annualSavingInr }))}
                format={(n) => formatRupeesCompact(n)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended measures</CardTitle>
              <CardDescription>Capex &amp; payback are indicative benchmarks — confirm with a site audit.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Measure</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Saving/yr</TableHead>
                      <TableHead className="text-right">kWh/yr</TableHead>
                      <TableHead className="text-right">Capex</TableHead>
                      <TableHead className="pr-6 text-right">Payback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {e.measures.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="pl-6">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.note}</div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-primary">{formatRupeesCompact(m.annualSavingInr)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatIndianNumber(m.annualKwhSaved)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupees(m.capexInr)}</TableCell>
                        <TableCell className="pr-6 text-right tabular-nums">{m.paybackYrs} yr</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Upload a few bills so we can size your consumption — then we&apos;ll rank the efficiency
            measures that cut it.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
