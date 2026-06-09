import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, IndianRupee, Gauge, TrendingDown, Activity } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/app/stat-card";
import { BarChart } from "@/components/charts/bar-chart";
import { api, MONTHS } from "@/lib/api";
import { formatRupees, formatRupeesCompact, formatIndianNumber, formatUnit } from "@/lib/format";

export async function generateStaticParams() {
  const buildings = await api.portfolio.buildings();
  return buildings.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await api.portfolio.building(id);
  return { title: b ? b.name : "Building" };
}

export default async function BuildingProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const b = await api.portfolio.building(id);
  if (!b) notFound();

  const monthlySpend = b.trendL[b.trendL.length - 1] * 100000;
  const recentBills = await api.portfolio.recentBills();
  const bills = recentBills.filter((r) => r.buildingId === b.id);

  const profile: { label: string; value: string }[] = [
    { label: "Type", value: b.type },
    { label: "DISCOM", value: b.discom },
    { label: "Supply voltage", value: b.supplyVoltage },
    { label: "Tariff category", value: b.tariffCategory },
    { label: "Built-up area", value: `${formatIndianNumber(b.areaSqft)} ft²` },
    { label: "Sanctioned load", value: `${b.sanctionedLoadKw} kW` },
    { label: "Contract demand", value: `${b.contractDemandKva} kVA` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/app/buildings">
            <ArrowLeft className="h-4 w-4" /> All buildings
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{b.name}</h1>
            <p className="text-sm text-muted-foreground">
              {b.city} · {b.type}
            </p>
          </div>
          <Badge variant={b.pf < 0.9 ? "warning" : "secondary"}>
            PF {b.pf.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly spend" value={formatRupeesCompact(monthlySpend)} icon={IndianRupee} />
        <StatCard label="EPI" value={`${b.epi}`} hint="kWh/ft²/year" icon={Activity} />
        <StatCard label="Power factor" value={b.pf.toFixed(2)} icon={Gauge} tone={b.pf < 0.9 ? "warning" : "default"} />
        <StatCard label="Savings identified" value={`${formatRupeesCompact(b.savingsINR)}/yr`} icon={TrendingDown} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend trend</CardTitle>
            <CardDescription>Last 12 months, ₹ lakh.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              caption={`Monthly spend for ${b.name}`}
              data={b.trendL.map((v, i) => ({ label: MONTHS[i], value: v }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Auto-populated from bills.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {profile.map((p) => (
                <div key={p.label} className="flex justify-between gap-4 py-2 first:pt-0">
                  <dt className="text-muted-foreground">{p.label}</dt>
                  <dd className="text-right font-medium">{p.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent bills</CardTitle>
          <CardDescription>For this building.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <div className="font-medium">{bill.month}</div>
                <div className="text-sm text-muted-foreground">
                  {formatUnit(bill.kwh, "kWh")} · {bill.discom}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatRupees(bill.amountINR)}</span>
                <Badge variant={bill.status === "Anomaly" ? "destructive" : bill.status === "Pending" ? "warning" : "success"}>
                  {bill.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/analyze">Analyze a new bill</Link>
        </Button>
      </div>
    </div>
  );
}
