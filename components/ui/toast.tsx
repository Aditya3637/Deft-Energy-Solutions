"use client";

import * as React from "react";
import { X } from "lucide-react";

type Toast = { id: number; title: string; description?: string };
type ToastContextValue = { toast: (t: Omit<Toast, "id">) => void };

const ToastContext = React.createContext<ToastContextValue | null>(null);

let counter = 0;

/** Minimal toast system so no action is ever a silent no-op (DoD: feedback). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return React.useContext(ToastContext) ?? { toast: () => {} };
}
