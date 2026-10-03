import { requireRole } from "@/lib/auth";
import { getAlerts } from "@/lib/data";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { AlertsManager } from "@/components/console/AlertsManager";
import { BellRing, Radio } from "lucide-react";

export default async function ConsoleAlertsPage() {
  const session = await requireRole([
    "viewer",
    "officer",
    "moderator",
    "city_admin",
    "state_admin",
  ]);

  const alerts = await getAlerts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#F28C28]/15 px-2 py-0.5 text-xs font-bold text-[#F28C28] uppercase tracking-wider">
                Emergency Telemetry
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Caller: {session.role}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Atmospheric Inversion & Pollution-Trap Alerts
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Automated broadcast history of micro-meteorological trap warnings and severe particulate spike advisories.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground max-w-xs flex items-center gap-2">
            <Radio className="h-4 w-4 shrink-0 text-[#0E9AA7]" />
            <span>
              Real-time SMS & Dashboard dispatch to schools, hospitals, and citizen subscribers.
            </span>
          </div>
        </div>

        <AlertsManager initialAlerts={alerts} />
      </main>
    </div>
  );
}
