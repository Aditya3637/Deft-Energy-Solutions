import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";

const NAV = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/pricing" },
];

/**
 * Marketing / pre-login shell: sticky header, normal page scroll, footer.
 * (DoD: links go somewhere real; sticky header stays pinned on scroll.)
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/analyze">Analyze a bill</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Brand />
          <p>© {new Date().getFullYear()} Deft Energy Solutions.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/roi-calculator" className="hover:text-foreground">ROI calculator</Link>
            <Link href="/developers" className="hover:text-foreground">Developers</Link>
            <Link href="/status" className="hover:text-foreground">Status</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
