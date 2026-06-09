import { Wallet, HandCoins, Send, Landmark } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { CollectionsWorklist } from "@/components/app/collections-worklist";
import { collections } from "@/lib/api/collections";
import { formatRupeesCompact } from "@/lib/format";

export const metadata = { title: "Collections" };

const MODE_LABEL: Record<string, string> = {
  BBPS: "BBPS (Bharat Connect)",
  DIRECT: "Direct DISCOM agency",
  MANUAL: "Manual / offline",
};
const COMM_LABEL: Record<string, string> = {
  PER_TXN: "Flat per txn",
  PERCENT: "% of collection",
  PERCENT_SPLIT: "% current / arrears",
};

export default async function CollectionsPage() {
  const [summary, licenses, worklist] = await Promise.all([
    collections.summary(),
    collections.licenses(),
    collections.worklist(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Act as a licensed collection agent across DISCOMs — pull what's due, collect from consumers, remit to the utility, and track the commission we earn back."
      />

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Sandbox.</span> This is the system of record + connector
        seam. Moving real money needs a live rail — a BBPS Agent-Institution/BBPOU tie-up or each DISCOM&rsquo;s
        agency agreement, a sponsor/nodal bank, and KYC. See <code>docs/COLLECTION-AGENT.md</code>.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Collected" value={formatRupeesCompact(summary.collectedInr)} hint={`${summary.activeLicenses} active license${summary.activeLicenses === 1 ? "" : "s"}`} icon={HandCoins} />
        <StatCard label="Commission earned" value={formatRupeesCompact(summary.commissionInr)} hint="our revenue back" icon={Wallet} tone="success" />
        <StatCard label="Pending remittance" value={formatRupeesCompact(summary.pendingRemitInr)} hint="collected, not yet settled" icon={Send} tone={summary.pendingRemitInr > 0 ? "warning" : "default"} />
        <StatCard label="Working balance" value={formatRupeesCompact(summary.floatInr)} hint={`${formatRupeesCompact(summary.remittedInr)} remitted to DISCOMs`} icon={Landmark} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DISCOM licenses</CardTitle>
          <CardDescription>
            Each license carries its own mode, commission model and settlement cycle — configured per the
            DISCOM&rsquo;s agency terms or the BBPS rail.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {licenses.map((l) => {
            const d = summary.byDiscom.find((x) => x.discom === l.discom);
            return (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.discom}</span>
                    <Badge variant={l.status === "ACTIVE" ? "success" : "secondary"}>{l.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {MODE_LABEL[l.mode] ?? l.mode} · {COMM_LABEL[l.commissionType] ?? l.commissionType} · {l.settlementCycle}
                    {l.aggregator ? ` · ${l.aggregator}` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatRupeesCompact(d?.collectedInr ?? 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRupeesCompact(d?.commissionInr ?? 0)} commission
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collection worklist</CardTitle>
          <CardDescription>
            Unpaid bills to chase, overdue first. Recording a collection settles the bill on the payments
            layer and books the commission.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <CollectionsWorklist initial={worklist} />
        </CardContent>
      </Card>
    </div>
  );
}
