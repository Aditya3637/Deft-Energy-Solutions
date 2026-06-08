import { FileText, Zap, IndianRupee, Gauge } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { formatRupeesCompact, formatUnit } from "@/lib/format";

export const metadata = { title: "Dashboard" };

// Placeholder demo data — Stage D replaces this with the mock-API seam.
const stats = [
  { label: "Bills this month", value: "1,248", icon: FileText, hint: "+4.2% vs last month" },
  { label: "Tracked consumption", value: formatUnit(8_42_000, "kWh"), icon: Zap, hint: "across 36 buildings" },
  { label: "Identified savings", value: formatRupeesCompact(1_24_50_000), icon: IndianRupee, hint: "annualised" },
  { label: "Avg power factor", value: "0.94", icon: Gauge, hint: "12 sites below 0.90" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio overview — foundation demo (Stage A).
          </p>
        </div>
        <Badge variant="secondary">Demo data</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent diagnoses</CardTitle>
          <CardDescription>
            Bills uploaded across the portfolio will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="No bills analysed yet"
            description="Upload a bill to get an instant diagnosis and a quantified savings number."
            action={{ label: "Analyze a bill", href: "/analyze" }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
