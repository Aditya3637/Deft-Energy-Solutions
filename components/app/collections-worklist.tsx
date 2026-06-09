"use client";

import * as React from "react";
import Link from "next/link";
import { HandCoins, CheckCircle2 } from "lucide-react";

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
import { collections, type WorklistItem } from "@/lib/api/collections";
import { formatRupees } from "@/lib/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
}

function newKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `wl-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  }
}

export function CollectionsWorklist({ initial }: { initial: WorklistItem[] }) {
  const [items, setItems] = React.useState<WorklistItem[]>(initial);
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const collect = async (w: WorklistItem) => {
    if (!w.licenseId || busy) return;
    setBusy(w.billId);
    // Optimistic — mark collected; the bill is settled on the payments layer server-side.
    setDone((d) => ({ ...d, [w.billId]: true }));
    await collections.record({
      licenseId: w.licenseId,
      billId: w.billId,
      consumerNumber: w.consumerNumber,
      amountInr: w.amountInr,
      isOutstanding: w.daysOverdue > 0,
      method: "UPI",
      idempotencyKey: newKey(),
    });
    setBusy(null);
    // Drop the row shortly after, so the list reflects the queue shrinking.
    setTimeout(() => setItems((prev) => prev.filter((x) => x.billId !== w.billId)), 900);
  };

  if (items.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nothing to chase — every tracked bill is paid.</p>;
  }

  return (
    <div className="max-h-[32rem] overflow-auto scrollbar-thin">
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead className="pl-6">Asset</TableHead>
            <TableHead>DISCOM</TableHead>
            <TableHead>Consumer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="pr-6 text-right">Collect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((w) => {
            const collected = done[w.billId];
            return (
              <TableRow key={w.billId}>
                <TableCell className="pl-6 font-medium">
                  {w.buildingId ? (
                    <Link href={`/app/buildings/${w.buildingId}`} className="hover:underline">{w.asset}</Link>
                  ) : (
                    w.asset
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{w.discom}</TableCell>
                <TableCell className="text-muted-foreground">{w.consumerNumber || "—"}</TableCell>
                <TableCell className="tabular-nums">{formatRupees(w.amountInr)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {fmtDate(w.dueOn)}
                  {w.daysOverdue > 0 ? <span className="ml-1.5 text-xs font-medium text-destructive">{w.daysOverdue}d late</span> : null}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {collected ? (
                    <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Collected</Badge>
                  ) : w.licenseId ? (
                    <Button size="sm" className="h-8" disabled={busy === w.billId} onClick={() => collect(w)}>
                      <HandCoins className="h-3.5 w-3.5" /> Collect
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No license for {w.discom}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
