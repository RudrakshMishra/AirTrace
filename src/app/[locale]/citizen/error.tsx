"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function CitizenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Citizen page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F28C28]/15 text-[#F28C28] mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-black text-foreground">
        वार्ड डेटा लोड नहीं हो सका / Could not load Ward Data
      </h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        कृपया अपना इंटरनेट कनेक्शन जांचें या पुनः प्रयास करें। (Please check your connection and try again.)
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A5F] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 dark:bg-[#0E9AA7] transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>पुनः प्रयास करें (Retry)</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
        >
          <Home className="h-3.5 w-3.5" />
          <span>मुख्य पृष्ठ (Home)</span>
        </Link>
      </div>
    </div>
  );
}
