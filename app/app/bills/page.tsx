import Link from "next/link";
import { FileText, IndianRupee, TrendingDown, AlertTriangle, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { api, MONTHS, TOTAL_BILLS_TRACKED, type RecentBill } from "@/lib/api";
import { formatRupees, formatRupeesCompact, formatUnit } from "@/lib/format";

export const metadata = { title: "Bills" };

const statusVariant: Record<RecentBill["status"], "success" | "warning" | "destructive"> = {
  Analyzed: "success",
  Pending: "warning",
  Anomaly: "destructive",
};

export default async function BillsPage() {
  const [monthly, recentBills, analyzed] = await Promise.all([
    api.portfolio.monthly(),
    api.portfolio.recentBills(),
    api.bills.listAnalyzed(),
  ]);
  const anomalies = recentBills.filter((b) => b.status === "Anomaly").length;
  const totalBilledThisMonth = recentBills
    .filter((b) => b.month === "May 2026")
    .reduce((s, b) => s + b.amountINR, 0);
  const totalRecoverable = analyzed.reduce((s, b) => s + (b.recoverableInr ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Every bill across the portfolio, with month-on-month trend."
        action={{ label: "Analyze a bill", href: "/analyze" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bills tracked" value={TOTAL_BILLS_TRACKED.toLocaleString("en-IN")} hint="all time" icon={FileText} />
        <StatCard label="Billed this month" value={formatRupeesCompact(totalBilledThisMonth)} hint="May 2026" icon={IndianRupee} />
        <StatCard label="Recoverable found" value={formatRupeesCompact(totalRecoverable)} hint={`${analyzed.length} analyzed bill${analyzed.length === 1 ? "" : "s"}`} icon={TrendingDown} tone={totalRecoverable > 0 ? "success" : "default"} />
        <StatCard label="Anomalies" value={String(anomalies)} hint="flagged for review" icon={AlertTriangle} tone={anomalies > 0 ? "warning" : "default"} />
      </div>

      {/* Core loop closes here: bills you analyzed + the savings found, with the action to act. */}
      <Card>
        <CardHeader>
          <CardTitle>Your analyzed bills</CardTitle>
          <CardDescription>
            Bills you&rsquo;ve uploaded and confirmed — each with the recoverable savings our engine found.
          </CardDescription>
        </CardHeader>
        <CardContent className={analyzed.length === 0 ? undefined : "px-0"}>
          {analyzed.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                No analyzed bills yet. Upload a bill and the savings we find will show up here.
              </p>
              <Button asChild>
                <Link href="/analyze">
                  Analyze a bill <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead className="pl-6">Bill</TableHead>
                  <TableHead>DISCOM</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-6 text-right">Recoverable / yr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyzed.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">{b.title}</TableCell>
                    <TableCell className="text-muted-foreground">{b.discom}</TableCell>
                    <TableCell>{b.month}</TableCell>
                    <TableCell className="tabular-nums">{formatRupees(b.amountInr)}</TableCell>
                    <TableCell className="pr-6 text-right font-semibold text-primary tabular-nums">
                      {b.recoverableInr ? formatRupees(b.recoverableInr) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month-on-month spend</CardTitle>
          <CardDescription>Portfolio total, ₹ lakh.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            caption="Portfolio monthly spend in lakh rupees"
            data={monthly.map((v, i) => ({ label: MONTHS[i], value: v }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent bills</CardTitle>
          <CardDescription>Most recent uploads across all buildings.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="max-h-[28rem] overflow-auto scrollbar-thin">
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead className="pl-6">Building</TableHead>
                  <TableHead>DISCOM</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-medium">
                      <Link href={`/app/buildings/${b.buildingId}`} className="hover:underline">
                        {b.building}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.discom}</TableCell>
                    <TableCell>{b.month}</TableCell>
                    <TableCell>{formatUnit(b.kwh, "kWh")}</TableCell>
                    <TableCell>{formatRupees(b.amountINR)}</TableCell>
                    <TableCell>
                      <Badge variant={b.pf < 0.9 ? "warning" : "secondary"}>
                        {b.pf.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-muted-foreground">
            <span>
              Showing {recentBills.length} of{" "}
              {TOTAL_BILLS_TRACKED.toLocaleString("en-IN")}
            </span>
            <span className="text-xs">Pagination wired to the API at Stage F</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
