"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw } from "lucide-react";

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
import { payments, type PaymentRow, type PaymentStatus } from "@/lib/api/payments";
import { formatRupees } from "@/lib/format";

const META: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  PAID_ON_TIME: { label: "Paid on time", variant: "success" },
  PAID_LATE: { label: "Paid late", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  DUE_SOON: { label: "Due soon", variant: "warning" },
  UPCOMING: { label: "Upcoming", variant: "secondary" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const isPaid = (s: PaymentStatus) => s === "PAID_ON_TIME" || s === "PAID_LATE";

export function PaymentsTable({ initialRows }: { initialRows: PaymentRow[] }) {
  const [rows, setRows] = React.useState<PaymentRow[]>(initialRows);
  const [busy, setBusy] = React.useState<string | null>(null);

  const setRow = (id: string, patch: Partial<PaymentRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const pay = async (r: PaymentRow) => {
    setBusy(r.id);
    // Optimistic: paying now → on-time unless the due date has already passed.
    const onTime = !r.dueOn || Date.now() <= new Date(r.dueOn).getTime() + 86_400_000;
    setRow(r.id, {
      status: onTime ? "PAID_ON_TIME" : "PAID_LATE",
      paidAt: new Date().toISOString(),
      paidAmount: r.amountInr,
      daysOverdue: 0,
    });
    const res = await payments.markPaid(r.id);
    if (res) setRow(r.id, res); // reconcile with the server's derived status
    setBusy(null);
  };

  const undo = async (r: PaymentRow) => {
    setBusy(r.id);
    setRow(r.id, { status: "UPCOMING", paidAt: null, paidAmount: null });
    const res = await payments.unpay(r.id);
    if (res) setRow(r.id, res);
    setBusy(null);
  };

  return (
    <div className="max-h-[34rem] overflow-auto scrollbar-thin">
      <Table>
        <TableHeader sticky>
          <TableRow>
            <TableHead className="pl-6">Asset</TableHead>
            <TableHead>DISCOM</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const meta = META[r.status];
            return (
              <TableRow key={r.id}>
                <TableCell className="pl-6 font-medium">
                  {r.buildingId ? (
                    <Link href={`/app/buildings/${r.buildingId}`} className="hover:underline">
                      {r.building}
                    </Link>
                  ) : (
                    r.building
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.discom}</TableCell>
                <TableCell className="text-muted-foreground">{r.month}</TableCell>
                <TableCell className="tabular-nums">{formatRupees(r.amountInr)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {fmtDate(r.dueOn)}
                  {r.status === "OVERDUE" && r.daysOverdue > 0 ? (
                    <span className="ml-1.5 text-xs font-medium text-destructive">
                      {r.daysOverdue}d late
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {isPaid(r.status) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground"
                      disabled={busy === r.id}
                      onClick={() => undo(r)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Undo
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8" disabled={busy === r.id} onClick={() => pay(r)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                    </Button>
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
