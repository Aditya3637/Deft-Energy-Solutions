"use client";

import { ErrorState } from "@/components/states/error-state";

/** Root error boundary (DoD: recoverable, never a raw stack trace). */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-2xl place-items-center p-6">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. You can try again."
        onRetry={reset}
        className="w-full"
      />
    </div>
  );
}
