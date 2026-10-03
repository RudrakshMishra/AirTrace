import { Link } from "@/i18n/routing";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0E9AA7]/10 text-[#0E9AA7] mb-6">
        <Compass className="h-10 w-10 animate-pulse" />
      </div>

      <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#0E9AA7]">
        404 • Page Not Found
      </span>

      <h1 className="mt-2 text-3xl sm:text-4xl font-black text-foreground tracking-tight">
        Atmosphere out of range
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        The ward, telemetry node, or console section you requested does not exist or has been relocated to another boundary.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <Link
          href="/citizen"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Citizen Portal</span>
        </Link>
      </div>
    </div>
  );
}
