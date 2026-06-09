"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { billing, type PlanId } from "@/lib/api";

/**
 * Starts an upgrade. With a live gateway (Razorpay) it redirects to the hosted
 * payment link and the webhook activates the plan. In manual/sandbox mode it
 * self-activates (or shows invoice instructions). Falls back to a sign-in prompt
 * when the caller isn't authenticated.
 */
export function UpgradeButton({
  plan,
  label,
  variant = "default",
}: {
  plan: PlanId;
  label: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const res = await billing.checkout(plan);
    if (!res) {
      toast({ title: "Sign in to upgrade", description: "Please sign in, then upgrade from Settings." });
      setBusy(false);
      return;
    }
    if (res.mode === "razorpay" && res.redirectUrl) {
      window.location.href = res.redirectUrl; // hosted payment → webhook activates
      return;
    }
    // Manual/sandbox: try self-activation, else surface the invoice instructions.
    const ok = await billing.activate(plan);
    if (ok) {
      toast({ title: "Plan updated", description: `You're now on the ${plan} plan.` });
      router.refresh();
    } else {
      toast({ title: "Invoice requested", description: res.instructions ?? "We'll be in touch to activate." });
    }
    setBusy(false);
  }

  return (
    <Button variant={variant} disabled={busy} onClick={go}>
      {busy ? "Working…" : label} <ArrowUpRight className="ml-1 h-4 w-4" />
    </Button>
  );
}
