"use client";

import * as React from "react";
import { Check, X, IndianRupee, Clock, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CAPEX_REQUESTS,
  STAGE_FLOW,
  STAGE_LABELS,
  type CapexRequest,
  type Stage,
} from "@/lib/mock/capex";
import { formatRupeesCompact } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";

const PIPELINE: Stage[] = ["fm", "em", "cfo", "board"];

export function CapexApprovals() {
  const [reqs, setReqs] = React.useState<CapexRequest[]>(() =>
    CAPEX_REQUESTS.map((r) => ({ ...r })),
  );

  const advance = (id: string) =>
    setReqs((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const i = STAGE_FLOW.indexOf(r.stage);
        const next = STAGE_FLOW[Math.min(STAGE_FLOW.length - 1, i + 1)];
        return { ...r, stage: next };
      }),
    );
  const reject = (id: string) =>
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, stage: "rejected" } : r)));

  const pending = reqs.filter((r) => r.stage !== "approved" && r.stage !== "rejected");
  const pipelineINR = pending.reduce((s, r) => s + r.amountINR, 0);
  const approvedINR = reqs.filter((r) => r.stage === "approved").reduce((s, r) => s + r.amountINR, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending approvals" value={String(pending.length)} icon={Clock} tone={pending.length ? "warning" : "default"} />
        <StatCard label="In pipeline" value={formatRupeesCompact(pipelineINR)} icon={IndianRupee} />
        <StatCard label="Approved" value={formatRupeesCompact(approvedINR)} icon={CheckCircle2} tone="success" />
      </div>

      <div className="space-y-3">
        {reqs.map((r) => {
          const settled = r.stage === "approved" || r.stage === "rejected";
          const stageIndex = PIPELINE.indexOf(r.stage);
          return (
            <Card key={r.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{r.project}</h3>
                    <p className="text-sm text-muted-foreground">
                      {r.building} · requested by {r.requestedBy} · payback {r.paybackYrs} yr
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatRupeesCompact(r.amountINR)}</div>
                    {r.stage === "approved" && <Badge variant="success">Approved</Badge>}
                    {r.stage === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                  </div>
                </div>

                {/* Stage pipeline */}
                {!settled && (
                  <div className="flex items-center gap-1.5">
                    {PIPELINE.map((s, i) => (
                      <React.Fragment key={s}>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            i < stageIndex && "bg-success/15 text-success",
                            i === stageIndex && "bg-primary text-primary-foreground",
                            i > stageIndex && "bg-muted text-muted-foreground",
                          )}
                        >
                          {STAGE_LABELS[s]}
                        </span>
                        {i < PIPELINE.length - 1 && <span className="h-px w-3 bg-border" />}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {!settled && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => reject(r.id)}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => advance(r.id)}>
                      <Check className="h-4 w-4" />
                      {r.stage === "board" ? "Approve" : `Approve as ${STAGE_LABELS[r.stage]}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
