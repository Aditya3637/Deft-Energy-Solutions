import { ShieldCheck, FileText, Sparkles } from "lucide-react";

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
import { api, type ComplianceStatus } from "@/lib/api";

export const metadata = { title: "Compliance" };

const statusVariant: Record<ComplianceStatus, "success" | "warning" | "destructive" | "secondary"> = {
  compliant: "success",
  at_risk: "warning",
  overdue: "destructive",
  upcoming: "secondary",
};
const statusLabel: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  at_risk: "At risk",
  overdue: "Overdue",
  upcoming: "Upcoming",
};

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function CompliancePage() {
  const [OBLIGATIONS, BRSR_SECTIONS, ESG] = await Promise.all([
    api.sustainability.obligations(),
    api.sustainability.brsrSections(),
    api.sustainability.esg(),
  ]);
  const compliant = OBLIGATIONS.filter((o) => o.status === "compliant").length;
  const compliancePct = Math.round((compliant / OBLIGATIONS.length) * 100);
  const overdue = OBLIGATIONS.filter((o) => o.status === "overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" description="Scorecard, BRSR and ESG — fed by your energy data." />

      <Tabs defaultValue="scorecard">
        <TabsList>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="brsr">BRSR</TabsTrigger>
          <TabsTrigger value="esg">ESG</TabsTrigger>
        </TabsList>

        {/* R13 Scorecard */}
        <TabsContent value="scorecard" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Overall compliance" value={`${compliancePct}%`} icon={ShieldCheck} tone={compliancePct < 80 ? "warning" : "success"} />
            <StatCard label="Obligations tracked" value={String(OBLIGATIONS.length)} icon={FileText} />
            <StatCard label="Overdue" value={String(overdue)} icon={ShieldCheck} tone={overdue ? "warning" : "success"} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Regulatory obligations</CardTitle>
              <CardDescription>Across frameworks and sites.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Obligation</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OBLIGATIONS.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="pl-6 font-medium">{o.name}</TableCell>
                        <TableCell className="text-muted-foreground">{o.framework}</TableCell>
                        <TableCell>{o.due}</TableCell>
                        <TableCell className="text-muted-foreground">{o.owner}</TableCell>
                        <TableCell className="pr-6">
                          <Badge variant={statusVariant[o.status]}>{statusLabel[o.status]}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* R01 BRSR */}
        <TabsContent value="brsr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BRSR report builder (FY 25-26)</CardTitle>
              <CardDescription>
                The environment section is auto-populated from your energy and emissions data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {BRSR_SECTIONS.map((s) => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.auto && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" /> auto
                        </Badge>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{s.pct}%</span>
                  </div>
                  <Bar pct={s.pct} />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button title="PDF export at Stage G">Generate BRSR report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* R02 ESG */}
        <TabsContent value="esg" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="ESG score" value={`${ESG.overall}/100`} icon={ShieldCheck} />
            <StatCard label="Environment" value={`${ESG.environment}`} icon={ShieldCheck} />
            <StatCard label="Social" value={`${ESG.social}`} icon={ShieldCheck} />
            <StatCard label="Governance" value={`${ESG.governance}`} icon={ShieldCheck} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Pillar breakdown</CardTitle>
              <CardDescription>{ESG.percentile}. The Environment pillar is driven by platform data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Environment", pct: ESG.environment },
                { label: "Social", pct: ESG.social },
                { label: "Governance", pct: ESG.governance },
              ].map((p) => (
                <div key={p.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.label}</span>
                    <span className="tabular-nums text-muted-foreground">{p.pct}/100</span>
                  </div>
                  <Bar pct={p.pct} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
