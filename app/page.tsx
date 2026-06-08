import Link from "next/link";
import { Upload, Search, TrendingDown, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicShell } from "@/components/layout/public-shell";

const loop = [
  {
    icon: Upload,
    title: "Upload a bill",
    body: "Drag in a PDF or snap a photo. We read all 42 fields for you.",
  },
  {
    icon: Search,
    title: "Instant diagnosis",
    body: "Power factor, contract demand, tariff fit and ToD — checked in seconds.",
  },
  {
    icon: TrendingDown,
    title: "Quantified savings",
    body: "One headline number and the single action that captures most of it.",
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-5">
            For ~50,000 bills/month · ~5,000 users
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See what your electricity bill is hiding.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Upload one bill and get an instant diagnosis with a clear,
            quantified savings number — no signup, no spreadsheets, no jargon.
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
            Three clicks to insight
          </h2>
          <p className="mt-2 text-muted-foreground">
            The whole product, compressed into one loop.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {loop.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={step.title}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      Step {i + 1}
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
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

      {/* Foundation note */}
      <section id="product" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Component & state gallery</h3>
              <p className="text-sm text-muted-foreground">
                Stage A foundation — design system, shells, and the four screen
                states (loading / empty / error / populated).
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/styleguide">Open style guide</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
