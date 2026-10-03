import { requireRole } from "@/lib/auth";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { SettingsForm } from "@/components/console/SettingsForm";
import { SlidersHorizontal, Shield } from "lucide-react";

export default async function ConsoleSettingsPage() {
  const session = await requireRole(["city_admin", "state_admin"]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#0E9AA7]/10 px-2 py-0.5 text-xs font-bold text-[#0E9AA7] uppercase tracking-wider">
                System Calibration
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Caller: {session.role} ({session.cityId || "Statewide"})
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Operational Thresholds & Alert Templates
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Define meteorological inversion limits, severe trigger cutoffs, and customize bilingual SMS advisory templates.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground max-w-xs flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-[#0E9AA7]" />
            <span>
              Changes take effect immediately across all automated cron checks.
            </span>
          </div>
        </div>

        <SettingsForm userRole={session.role} userCityId={session.cityId} />
      </main>
    </div>
  );
}
