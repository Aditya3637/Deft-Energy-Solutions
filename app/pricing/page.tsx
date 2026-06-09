import Link from "next/link";
import { Check } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type Plan } from "@/lib/api";
import { formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Pricing" };

function priceLabel(p: Plan): string {
  if (p.custom) return "Custom";
  if (p.priceInr === 0) return "₹0";
  return `₹${formatIndianNumber(p.priceInr)}`;
}

function cta(p: Plan): { label: string; href: string } {
  if (p.id === "FREE") return { label: "Analyze a bill", href: "/analyze" };
  if (p.custom) return { label: "Talk to us", href: "/login?intent=enterprise" };
  return { label: "Start Pro", href: "/login?intent=pro" };
}

export default async function PricingPage() {
  const plans = await api.billing.plans();

  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, value-aligned pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Pay only when you manage a portfolio.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((t) => {
            const featured = t.id === "PRO";
            const c = cta(t);
            return (
              <Card key={t.id} className={featured ? "border-primary shadow-md" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t.name}</CardTitle>
                    {featured && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>{t.tagline}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-semibold">{priceLabel(t)}</span>
                    {t.unit && <span className="text-sm text-muted-foreground">{t.unit}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {t.highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={featured ? "default" : "outline"} asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
