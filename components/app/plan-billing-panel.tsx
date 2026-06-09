import Link from "next/link";
import { CreditCard, Building2, FileText, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, UNLIMITED, type Feature } from "@/lib/api";
import { formatIndianNumber } from "@/lib/format";

const FEATURE_LABEL: Record<Feature, string> = {
  alerts: "Alerts",
  tasks: "Tasks",
  roi: "ROI",
  compliance: "Compliance",
  carbon: "Carbon",
  exports: "Exports",
  markets: "Energy markets",
  assets: "DER assets",
  managedRecovery: "Managed recovery",
  sso: "SSO",
  api: "API",
  whiteLabel: "White-label",
};

function UsageRow({ icon: Icon, label, used, limit }: { icon: typeof Building2; label: string; used: number; limit: number }) {
  const unlimited = limit === UNLIMITED;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const atLimit = !unlimited && used >= limit;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <span className={`tabular-nums ${atLimit ? "font-medium text-warning" : ""}`}>
          {formatIndianNumber(used)} / {unlimited ? "∞" : formatIndianNumber(limit)}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${atLimit ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export async function PlanBillingPanel() {
  const s = await api.billing.status();
  const priceLabel = s.custom ? "Custom" : s.priceInr === 0 ? "₹0" : `₹${formatIndianNumber(s.priceInr)}${s.unit}`;
  const upgradeCta = s.plan === "FREE" ? "Upgrade to Pro" : s.plan === "PRO" ? "Compare plans" : "Manage plan";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Plan &amp; billing
            </CardTitle>
            <CardDescription>Your current plan, usage and what each tier unlocks.</CardDescription>
          </div>
          <Badge variant={s.status === "active" ? "success" : "warning"} className="capitalize">{s.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">{s.planName}</div>
            <div className="text-sm text-muted-foreground">{priceLabel}</div>
          </div>
          <Button asChild variant={s.plan === "ENTERPRISE" ? "outline" : "default"}>
            <Link href="/pricing">
              {upgradeCta} <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <UsageRow icon={Building2} label="Buildings" used={s.usage.buildings} limit={s.limits.buildings} />
          <UsageRow icon={FileText} label="Saved bills (this month)" used={s.usage.savedBillsThisMonth} limit={s.limits.savedBillsPerMonth} />
        </div>

        {s.features.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Included</p>
            <div className="flex flex-wrap gap-1.5">
              {s.features.map((f) => (
                <Badge key={f} variant="secondary">{FEATURE_LABEL[f] ?? f}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
