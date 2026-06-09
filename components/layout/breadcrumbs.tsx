"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";

/** Known section labels use i18n; unknown slugs (ids) are prettified. */
function prettify(seg: string): string {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * App breadcrumbs derived from the path (DoD: orient the user at depth > 1).
 * Rendered only under /app and only when there's a sub-route to show.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useLocale();
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] !== "app" || segs.length < 2) return null;

  const crumbs = segs.slice(1).map((seg, i) => {
    const href = "/" + segs.slice(0, i + 2).join("/");
    const key = `nav.${seg.toLowerCase()}`;
    const label = t(key) !== key ? t(key) : prettify(seg);
    return { href, label, last: i === segs.length - 2 };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center text-sm sm:flex">
      <Link href="/app" className="text-muted-foreground hover:text-foreground">
        {t("nav.dashboard")}
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center">
          <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/60" />
          {c.last ? (
            <span aria-current="page" className="font-medium text-foreground">
              {c.label}
            </span>
          ) : (
            <Link href={c.href} className="text-muted-foreground hover:text-foreground">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
