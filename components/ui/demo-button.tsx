"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * A button for demo actions whose real behaviour ships with the backend.
 * Clicking gives honest feedback via a toast instead of silently doing nothing
 * (DoD: no silent no-ops). Usable inside server components (it's a client island).
 */
export function DemoButton({
  toastTitle,
  toastDescription,
  children,
  ...props
}: ButtonProps & { toastTitle: string; toastDescription?: string }) {
  const { toast } = useToast();
  return (
    <Button
      {...props}
      onClick={() => toast({ title: toastTitle, description: toastDescription })}
    >
      {children}
    </Button>
  );
}
