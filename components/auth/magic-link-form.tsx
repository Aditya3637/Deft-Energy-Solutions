"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/api/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Magic-link sign-in wired to the real backend (no email provider yet → in dev
 * the link comes back so you can continue; live email is the deferred piece). */
export function MagicLinkForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [devToken, setDevToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const valid = EMAIL_RE.test(email);
  const showError = touched && email.length > 0 && !valid;

  // Magic-link click: verify a ?token= from the URL, then enter the workspace.
  React.useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    setStatus("verifying");
    auth
      .verify(token)
      .then(() => router.push("/app"))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Link expired — request a new one.");
        setStatus("idle");
      });
  }, [router]);

  const continueWithToken = async (token: string) => {
    setStatus("verifying");
    try {
      await auth.verify(token);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you in.");
      setStatus("sent");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setError(null);
    if (!auth.configured()) {
      setStatus("sent"); // demo: no backend — explore anonymously
      return;
    }
    setStatus("sending");
    try {
      const r = await auth.request(email);
      setDevToken(r.token ?? null);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link.");
      setStatus("idle");
    }
  };

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        Signing you in…
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="text-sm">
          A magic link is on its way to <span className="font-medium text-foreground">{email}</span>.
          Or jump in now — no sign-in needed to explore.
        </p>
        {devToken && (
          <Button className="w-full" onClick={() => continueWithToken(devToken)}>
            Continue (dev link) <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Button asChild variant={devToken ? "outline" : "default"} className="w-full">
          <Link href="/app">
            Continue to your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="link" className="h-auto p-0" onClick={() => { setStatus("idle"); setDevToken(null); }}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? "email-error" : undefined}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          required
        />
        {showError && (
          <p id="email-error" className="text-xs text-destructive">Enter a valid email address.</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={!valid || status === "sending"}>
        {status === "sending" ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
