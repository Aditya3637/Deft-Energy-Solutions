import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Deft Energy"
      subtitle="We'll email you a magic link — no password needed."
    >
      <MagicLinkForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/analyze" className="font-medium text-primary hover:underline">
          Analyze a bill first
        </Link>
      </p>
    </AuthShell>
  );
}
