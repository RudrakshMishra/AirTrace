"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Console view error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
        Console Telemetry Interrupted
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Unable to load live municipal records or administrative tables. This could be due to a transient network issue or role synchronization delay.
      </p>

      {error?.message && (
        <p className="mt-3 rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 font-mono text-xs text-destructive max-w-lg">
          {error.message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>

        <Link
          href="/console"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Console Overview</span>
        </Link>
      </div>
    </div>
  );
}
