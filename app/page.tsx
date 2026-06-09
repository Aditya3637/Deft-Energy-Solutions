import Link from "next/link";
import {
  Search,
  TrendingDown,
  ArrowRight,
  Zap,
  Sun,
  ArrowLeftRight,
  BatteryCharging,
  Leaf,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicShell } from "@/components/layout/public-shell";

// The core loop: one bill in → a savings plan out.
const loop = [
  {
    icon: Search,
    step: "Diagnose",
    body: "Upload a bill — PDF or photo. We read all 42 fields and run a 58-point leakage scan across 10 categories in seconds.",
  },
  {
    icon: TrendingDown,
    step: "Quantify",
    body: "Every leak becomes a rupee figure, ranked by what it's costing you — power factor, demand, tariff, time-of-day, billing errors.",
  },
  {
    icon: Zap,
    step: "Fix & save",
    body: "Act on quick wins now; model the big levers — solar, open access, storage — with ROI, approvals and vendors built in.",
  },
];

// The 10 leakage categories behind the 58-point diagnosis.
const categories = [
  "Contract demand",
  "Power factor",
  "Time-of-day",
  "Power quality & harmonics",
  "Tariff & classification",
  "Metering & billing errors",
  "Procurement (solar / open access)",
  "Infrastructure losses",
  "Surcharge, tax & regulatory",
  "Operational waste",
];

// Don't just find savings — capture them. The structural levers.
const levers = [
  {
    icon: Zap,
    title: "Power factor & demand",
    body: "Kill PF penalties and right-size contract demand — the fastest rupees on most commercial bills.",
  },
  {
    icon: ReceiptText,
    title: "Tariff & billing recovery",
    body: "Catch misclassification, wrong surcharges and metering errors — then reclaim what you were overcharged.",
  },
  {
    icon: Sun,
    title: "Rooftop solar",
    body: "Feasibility, CAPEX-vs-PPA and payback modelled from your real load profile — not a generic calculator.",
  },
  {
    icon: ArrowLeftRight,
    title: "Open access & IEX",
    body: "Buy power cheaper on the exchange — open-access eligibility, charges and net savings, quantified.",
  },
  {
    icon: BatteryCharging,
    title: "Battery storage (BESS)",
    body: "Peak shaving and time-of-day arbitrage, sized straight from your demand profile.",
  },
  {
    icon: Leaf,
    title: "Carbon, RECs & compliance",
    body: "Turn every kWh saved into Scope-2 cuts and stay ahead of RPO, BRSR and ESG reporting.",
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-5">
            Energy cost reduction · built for commercial &amp; industrial India
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See what your electricity bill is hiding — then fix it.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Upload one bill. Deft Energy runs a 58-point diagnosis across every
            way commercial power leaks money — power factor, contract demand,
            tariff, time-of-day — puts a rupee figure on each, and maps the fix:
            from same-day quick wins to solar, open access and storage. No
            signup, no spreadsheets, no jargon.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/analyze">
                Analyze a bill <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app">View the dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core loop */}
      <section id="how" className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            One bill in, a savings plan out
          </h2>
          <p className="mt-2 text-muted-foreground">
            The whole product, compressed into one loop — diagnose, quantify,
            fix.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {loop.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={step.step}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      Step {i + 1}
                    </div>
                    <h3 className="text-lg font-semibold">{step.step}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Depth of diagnosis — the 10 categories */}
      <section
        id="diagnosis"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Every way a commercial bill leaks money
        </h2>
        <p className="mt-2 text-muted-foreground">
          58 checks · 10 categories · 42 fields read from every bill — nothing
          slips through.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <Badge key={c} variant="secondary" className="px-3 py-1.5 text-sm">
              {c}
            </Badge>
          ))}
        </div>
      </section>

      {/* The fix — structural levers */}
      <section id="product" className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Don&apos;t just find the savings — capture them
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Most tools stop at the diagnosis. Deft Energy carries you to the
            fix — the quick wins and the big structural levers, each with the
            numbers to act on.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levers.map((lever) => {
              const Icon = lever.icon;
              return (
                <Card key={lever.title}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{lever.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lever.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two paths + closing CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Two ways to save</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardContent className="flex h-full flex-col pt-6">
              <h3 className="text-lg font-semibold">Self-serve</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                Explore the whole workspace free — analyze bills, model ROI,
                track fixes across every site. Upgrade only when you&apos;re
                ready to scale.
              </p>
              <div className="mt-5">
                <Button variant="outline" asChild>
                  <Link href="/app">View the dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex h-full flex-col pt-6">
              <h3 className="text-lg font-semibold">Done-for-you</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                Talk to an advisor. We file the corrections and structure the
                solar / open-access moves for you — success-based, so we only
                win when your bill drops.
              </p>
              <div className="mt-5">
                <Button variant="outline" asChild>
                  <Link href="/login">Talk to an advisor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Start with one bill.</h3>
              <p className="text-sm text-muted-foreground">
                See your quantified savings in three clicks — no signup
                required.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/analyze">
                Analyze a bill <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
