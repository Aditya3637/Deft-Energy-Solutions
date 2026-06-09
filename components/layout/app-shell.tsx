"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useLocale } from "@/components/i18n/locale-provider";
import { NAV_GROUPS } from "@/components/layout/nav-config";

/**
 * Authenticated app shell: fixed sidebar + topbar, single scroll region for
 * content (DoD: page content scrolls, not the whole app; sidebar/topbar stay
 * pinned). Mobile uses an overlay drawer with Esc-to-close and background
 * scroll lock.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  // Close drawer + reset the content scroll region to top on route change (DoD).
  React.useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Esc closes the drawer; lock background scroll while open (DoD).
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/app" ? pathname === href : pathname.startsWith(href);

  // Use the translation if present, else the item's own label (so newly added
  // items never render as a raw "nav.x" key).
  const labelOf = (label: string) => {
    const key = `nav.${label.toLowerCase()}`;
    const translated = t(key);
    return translated === key ? label : translated;
  };

  const NavLinks = () => (
    <nav className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {labelOf(item.label)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 shrink-0 items-center border-b px-4">
          <Brand href="/app" />
        </div>
        <NavLinks />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-card shadow-lg">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <Brand href="/app" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("org.demo")}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              DE
            </span>
          </div>
        </header>

        {/* The single scroll region. */}
        <main ref={mainRef} id="main-content" className="flex-1 overflow-y-auto scrollbar-thin">
          <div
            key={pathname}
            className="mx-auto w-full max-w-7xl p-4 duration-200 animate-in fade-in sm:p-6 lg:p-8"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
