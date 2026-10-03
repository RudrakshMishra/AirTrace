"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while processing air quality telemetry. You can try refreshing the page or return to safety.
      </p>

      {error?.digest && (
        <code className="mt-3 rounded-lg bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
          Incident ID: {error.digest}
        </code>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
