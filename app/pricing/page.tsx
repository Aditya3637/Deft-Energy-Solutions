import Link from "next/link";
import { Check } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pricing" };

const tiers = [
  {
    name: "Free",
    price: "₹0",
    tagline: "Analyse a bill, no signup",
    features: ["Single-bill analysis", "All 58 loss checks", "Savings estimate", "1 building"],
    cta: "Analyze a bill",
    href: "/analyze",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹4,999",
    unit: "/site/mo",
    tagline: "Manage a portfolio",
    features: ["Everything in Free", "Unlimited bills & history", "Alerts, tasks & ROI", "Compliance & carbon", "Up to 25 buildings"],
    cta: "Start free trial",
    href: "/login",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "Markets, assets & managed recovery",
    features: ["Everything in Pro", "Open access & trading", "BESS / microgrid / VPP", "Managed loss recovery", "SSO, API & white-label"],
    cta: "Talk to us",
    href: "/login",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, value-aligned pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Pay only when you manage a portfolio.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.name} className={t.featured ? "border-primary shadow-md" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.name}</CardTitle>
                  {t.featured && <Badge>Popular</Badge>}
                </div>
                <CardDescription>{t.tagline}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-semibold">{t.price}</span>
                  {t.unit && <span className="text-sm text-muted-foreground">{t.unit}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={t.featured ? "default" : "outline"} asChild>
                  <Link href={t.href}>{t.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
