import Link from "next/link";
import {
  Search,
  TrendingDown,
  ArrowRight,
  Zap,
  Scissors,
  ArrowLeftRight,
  BatteryCharging,
  Coins,
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
    body: "Act on quick wins now; model the big levers — efficiency, open access, solar, storage — with ROI, approvals and vendors built in.",
  },
];

// The savings ladder — mirrors the in-app Savings Stack (lib/savings-stack.ts).
// Five distinct mechanisms by which Deft moves money off an electricity bill.
const ladder = [
  {
    icon: TrendingDown,
    verb: "Recover",
    title: "Bill leakages & hidden costs",
    body: "Power factor penalties, wrong contract demand, tariff misfit, billing errors, late fees — caught by 58 checks. No capex, immediate.",
  },
  {
    icon: Scissors,
    verb: "Reduce",
    title: "Cut the consumption itself",
    body: "Efficiency retrofits sized to your load — LED, HVAC, VFDs, compressed air. The cheapest unit is the one you never use.",
  },
  {
    icon: ArrowLeftRight,
    verb: "Reprice",
    title: "Buy power cheaper",
    body: "Open access and the power exchange (IEX/PXIL) — landed cost vs your DISCOM tariff, every charge accounted for.",
  },
  {
    icon: BatteryCharging,
    verb: "Generate",
    title: "Produce & store your own",
    body: "Solar, battery (peak-shaving + arbitrage), microgrid and VPP — sized from your real demand profile, not a generic calculator.",
  },
  {
    icon: Coins,
    verb: "Earn",
    title: "Money back",
    body: "Carbon credits (CCTS), demand-response revenue and bill-payment cashback — turn savings into income.",
  },
];

// The 10 leakage categories behind the 58-point diagnosis (the "Recover" rung).
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

export default function HomePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-5">
            Recover · Reduce · Reprice · Generate · Earn
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See what your electricity bill is hiding — then capture every rupee.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Upload one bill for an instant, no-signup diagnosis. Then Deft Energy
            works the whole stack — recover billing leakages, reduce consumption,
            reprice your power, generate your own and earn money back. Every lever,
            one money story.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/analyze">
                Analyze a bill <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app/savings">See the savings stack</Link>
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
            The whole product, compressed into one loop — diagnose, quantify, fix.
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
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* The savings ladder — every lever, mirroring the in-app Savings Stack */}
      <section id="ladder" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Five levers, one money story
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The diagnosis is just the entry. Deft works the whole stack — each rung a
          different way to save or earn, quantified from your own data and totalled
          in one view.
        </p>
        <div className="mt-8 space-y-3">
          {ladder.map((rung, i) => {
            const Icon = rung.icon;
            return (
              <Card key={rung.verb}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {`0${i + 1}`} · {rung.verb}
                    </div>
                    <h3 className="mt-0.5 font-semibold">{rung.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{rung.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/app/savings">
              See the savings stack <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Depth of the Recover rung — the 10 diagnosis categories */}
      <section id="diagnosis" className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recover, in depth: every way a bill leaks money
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
                Explore the whole workspace free — analyze bills, model every
                lever, track fixes across each site. Upgrade only when you&apos;re
                ready to scale.
              </p>
              <div className="mt-5">
                <Button variant="outline" asChild>
                  <Link href="/app/savings">View the savings stack</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex h-full flex-col pt-6">
              <h3 className="text-lg font-semibold">Done-for-you</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                Talk to an advisor. We file the corrections and structure the
                efficiency / open-access / solar moves for you — success-based, so
                we only win when your bill drops.
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
                See your quantified savings in three clicks — no signup required.
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
