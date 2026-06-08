"use client";

import * as React from "react";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Offline-tolerance banner for field screens (DoD: field roles work with poor
 * connectivity). Changes are "saved on device" and sync when back online.
 */
export function SyncStatus({ pending = 0 }: { pending?: number }) {
  const [online, setOnline] = React.useState(true);
  const [count, setCount] = React.useState(pending);
  const [syncing, setSyncing] = React.useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setCount(0);
      setSyncing(false);
    }, 900);
  };

  const synced = online && count === 0 && !syncing;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
        online ? "bg-card" : "border-warning/40 bg-warning/10",
      )}
    >
      <div className="flex items-center gap-2">
        {online ? (
          <Cloud className="h-4 w-4 text-primary" />
        ) : (
          <CloudOff className="h-4 w-4 text-warning" />
        )}
        <span className="text-muted-foreground" aria-live="polite">
          {!online
            ? `Offline — ${count} change${count === 1 ? "" : "s"} saved on device`
            : syncing
              ? "Syncing…"
              : synced
                ? "All changes synced"
                : `${count} change${count === 1 ? "" : "s"} pending`}
        </span>
        {synced && <Check className="h-4 w-4 text-success" />}
      </div>
      <div className="flex items-center gap-2">
        {online && count > 0 && (
          <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} /> Sync
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOnline((o) => !o)}
          aria-pressed={!online}
        >
          {online ? "Go offline" : "Go online"}
        </Button>
      </div>
    </div>
  );
}
