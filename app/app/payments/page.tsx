import { IndianRupee, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { PaymentsTable } from "@/components/app/payments-table";
import { payments } from "@/lib/api/payments";
import { formatRupeesCompact } from "@/lib/format";

export const metadata = { title: "Payments & due dates" };

export default async function PaymentsPage() {
  const [summary, rows] = await Promise.all([payments.summary(), payments.list()]);
  const empty = summary.total === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & due dates"
        description="Every asset's bills, due dates and payment status in one place — track what's overdue, due soon, and paid on time across the portfolio."
      />

      {empty ? (
        <Card>
          <CardHeader>
            <CardTitle>No tracked bills yet</CardTitle>
            <CardDescription>
              Bills with a due date show up here automatically once uploaded or fetched — then you can
              mark each one paid and watch on-time performance across all your assets.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Outstanding"
              value={formatRupeesCompact(summary.outstandingInr)}
              hint={`${summary.unpaid} unpaid of ${summary.total}`}
              icon={IndianRupee}
              tone={summary.overdue.count > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Overdue"
              value={String(summary.overdue.count)}
              hint={`${formatRupeesCompact(summary.overdue.amountInr)} past due`}
              icon={AlertTriangle}
              tone={summary.overdue.count > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Due in 7 days"
              value={String(summary.dueSoon.count)}
              hint={`${formatRupeesCompact(summary.dueSoon.amountInr)} coming up`}
              icon={CalendarClock}
            />
            <StatCard
              label="Paid on time"
              value={summary.onTimePct == null ? "—" : `${summary.onTimePct}%`}
              hint={`${summary.paidOnTime} on time · ${summary.paidLate} late`}
              icon={CheckCircle2}
              tone={summary.onTimePct != null && summary.onTimePct < 90 ? "warning" : "success"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tracked bills</CardTitle>
              <CardDescription>
                Sorted by urgency — overdue first. Mark a bill paid to record it; on-time vs late is
                judged against the due date.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <PaymentsTable initialRows={rows} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
