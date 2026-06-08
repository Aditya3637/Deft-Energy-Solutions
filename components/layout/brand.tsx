import Link from "next/link";
import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

/** The Deft Energy wordmark + glyph. Links home unless `href` is overridden. */
export function Brand({
  href = "/",
  className,
  compact = false,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </span>
      {!compact && <span>Deft Energy</span>}
    </Link>
  );
}
