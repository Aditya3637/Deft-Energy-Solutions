import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Deft Energy"
      subtitle="We'll email you a magic link — no password needed."
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Send magic link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/analyze" className="font-medium text-primary hover:underline">
          Analyze a bill first
        </Link>
      </p>
    </AuthShell>
  );
}
