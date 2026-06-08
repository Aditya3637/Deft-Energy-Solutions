"use client";

import * as React from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { formatRupees, formatUnit, formatDate } from "@/lib/format";

const rows = [
  { discom: "MSEDCL", month: "2026-05-01", kwh: 124000, amount: 1842000, pf: 0.91 },
  { discom: "BESCOM", month: "2026-05-01", kwh: 86500, amount: 1190400, pf: 0.88 },
  { discom: "TANGEDCO", month: "2026-05-01", kwh: 203400, amount: 2980500, pf: 0.96 },
];

export default function StyleGuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Style guide</h1>
        <p className="text-sm text-muted-foreground">
          Stage A foundation — design tokens, components, and the four screen
          states. Toggle the data states below.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>
            <Spinner /> Loading
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">PF healthy</Badge>
          <Badge variant="warning">Review</Badge>
          <Badge variant="destructive">Penalty</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-sm gap-2">
          <Label htmlFor="sg-email">Work email</Label>
          <Input id="sg-email" type="email" placeholder="you@company.com" />
          <Label htmlFor="sg-bad">Invalid example</Label>
          <Input id="sg-bad" aria-invalid placeholder="Invalid state" />
        </div>
      </Section>

      <Section title="Indian formatting">
        <div className="flex flex-wrap gap-6 text-sm">
          <span>{formatRupees(1842000)}</span>
          <span>{formatUnit(124000, "kWh")}</span>
          <span>{formatDate("2026-05-01")}</span>
        </div>
      </Section>

      <Section title="Screen states">
        <DataStates />
      </Section>

      <Section title="Table (sticky header, scrollable)">
        <div className="max-h-64 overflow-auto rounded-lg border scrollbar-thin">
          <Table>
            <TableHeader sticky>
              <TableRow>
                <TableHead>DISCOM</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>PF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).flatMap((_, g) =>
                rows.map((r) => (
                  <TableRow key={`${g}-${r.discom}`}>
                    <TableCell className="font-medium">{r.discom}</TableCell>
                    <TableCell>{formatDate(r.month)}</TableCell>
                    <TableCell>{formatUnit(r.kwh, "kWh")}</TableCell>
                    <TableCell>{formatRupees(r.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={r.pf < 0.9 ? "warning" : "success"}>
                        {r.pf.toFixed(2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

function DataStates() {
  const [state, setState] = React.useState<
    "loading" | "empty" | "error" | "data"
  >("data");

  return (
    <Tabs value={state} onValueChange={(v) => setState(v as typeof state)}>
      <TabsList>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
        <TabsTrigger value="data">Populated</TabsTrigger>
      </TabsList>

      <TabsContent value="loading">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="empty">
        <EmptyState
          icon={FileText}
          title="No bills analysed yet"
          description="Upload a bill to get an instant diagnosis."
          action={{ label: "Analyze a bill", href: "/analyze" }}
        />
      </TabsContent>

      <TabsContent value="error">
        <ErrorState onRetry={() => setState("data")} />
      </TabsContent>

      <TabsContent value="data">
        <Card>
          <CardHeader>
            <CardTitle>Latest diagnosis</CardTitle>
            <CardDescription>MSEDCL · HT-I · May 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">
              {formatRupees(1450000)}/yr
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimated savings — correct power factor to 0.95.
            </p>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Badge variant="warning">PF 0.91</Badge>
              <Badge variant="secondary">Contract demand high</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
