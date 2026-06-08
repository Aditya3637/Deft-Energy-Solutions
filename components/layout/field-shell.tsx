"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { FIELD_NAV, type NavItem } from "@/components/layout/nav-config";

/**
 * Mobile-first shell for field roles (FM, auditor, collection agent).
 * Fixed top bar + bottom tab nav with safe-area insets; the middle scrolls
 * (DoD: bottom nav never covers content, notch-safe).
 */
export function FieldShell({
  children,
  title,
  nav = FIELD_NAV,
}: {
  children: React.ReactNode;
  title?: string;
  nav?: NavItem[];
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/field" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 pt-safe">
        <Brand href="/field" compact />
        {title ? <span className="text-sm font-medium">{title}</span> : null}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          DE
        </span>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {children}
      </main>

      <nav className="flex shrink-0 items-stretch border-t bg-card pb-safe">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
