"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { billing } from "@/lib/api";

/** Starts a no-card 14-day Pro trial, then refreshes so entitlements take effect. */
export function TrialButton({ label = "Start 14-day Pro trial" }: { label?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const ok = await billing.startTrial();
    if (ok) {
      toast({ title: "Pro trial started", description: "14 days of Pro — no card needed." });
      router.refresh();
    } else {
      toast({ title: "Couldn't start trial", description: "Sign in first, or your trial may already be used." });
      setBusy(false);
    }
  }

  return (
    <Button disabled={busy} onClick={go}>
      <Sparkles className="mr-1 h-4 w-4" /> {busy ? "Starting…" : label}
    </Button>
  );
}
