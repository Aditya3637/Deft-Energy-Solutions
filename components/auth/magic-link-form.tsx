"use client";

import * as React from "react";
import Link from "next/link";
import { MailCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Magic-link form with client-side validation (DoD: inline validation, primary
 * action disabled until valid, no data loss, clear success state).
 */
export function MagicLinkForm() {
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const valid = EMAIL_RE.test(email);
  const showError = touched && email.length > 0 && !valid;

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="text-sm">
          A magic link is on its way to{" "}
          <span className="font-medium text-foreground">{email}</span>. While you wait, jump straight
          into your workspace — no need to sign in to explore.
        </p>
        <Button asChild className="w-full">
          <Link href="/app">
            Continue to your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="link" className="h-auto p-0" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) setSent(true);
      }}
      className="space-y-4"
    >
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
          <p id="email-error" className="text-xs text-destructive">
            Enter a valid email address.
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={!valid}>
        Send magic link
      </Button>
    </form>
  );
}
