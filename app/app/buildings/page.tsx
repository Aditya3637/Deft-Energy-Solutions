import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { BUILDINGS, portfolioTotals } from "@/lib/mock/portfolio";
import { formatRupeesCompact, formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Buildings" };

export default function BuildingsPage() {
  const t = portfolioTotals();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        description="Consolidated view across every site in the portfolio."
        action={{ label: "Add building", href: "/app/buildings" }}
      />

      {/* Consolidated totals strip */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <Total label="Sites" value={String(t.buildings)} />
          <Total label="Annual spend" value={formatRupeesCompact(t.annualSpendINR)} />
          <Total label="Savings identified" value={`${formatRupeesCompact(t.savingsINR)}/yr`} />
          <Total label="Bills received" value={`${t.billsReceived}/${t.billsExpected}`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BUILDINGS.map((b) => {
          const dataGap = b.billsReceived < b.billsExpected;
          return (
            <Link key={b.id} href={`/app/buildings/${b.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <CardDescription>
                        {b.city} · {b.type} · {b.discom}
                      </CardDescription>
                    </div>
                    <Badge variant={b.pf < 0.9 ? "warning" : "secondary"}>
                      PF {b.pf.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Monthly spend" value={formatRupeesCompact(b.trendL[b.trendL.length - 1] * 100000)} />
                    <Metric label="Savings/yr" value={formatRupeesCompact(b.savingsINR)} accent />
                    <Metric label="EPI" value={`${b.epi} kWh/ft²`} />
                    <Metric label="Area" value={`${formatIndianNumber(b.areaSqft)} ft²`} />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    {dataGap ? (
                      <Badge variant="warning">
                        {b.billsExpected - b.billsReceived} bills missing
                      </Badge>
                    ) : (
                      <Badge variant="success">Up to date</Badge>
                    )}
                    <span className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                      View <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={accent ? "font-semibold text-primary" : "font-medium"}>{value}</div>
    </div>
  );
}
