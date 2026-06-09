"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/app/upgrade-button";
import type { PlanLimit } from "@/lib/api";

/**
 * Shown when a save is blocked by the plan quota (402). Turns the dead-end into
 * a one-click upgrade. `upgradeTo` comes straight from the server gate.
 */
export function UpgradePrompt({ limit, onDismiss }: { limit: PlanLimit; onDismiss?: () => void }) {
  const target = limit.upgradeTo ?? "PRO";
  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <h3 className="font-semibold">You&apos;ve hit your plan&apos;s limit</h3>
            <p className="text-sm text-muted-foreground">
              {limit.reason ?? "Upgrade to keep saving bills and monitoring your portfolio."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">See plans</Link>
          </Button>
          <UpgradeButton plan={target} label={`Upgrade to ${target === "ENTERPRISE" ? "Enterprise" : "Pro"}`} />
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Not now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
