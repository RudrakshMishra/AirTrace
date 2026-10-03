import { requireRole } from "@/lib/auth";
import { getActions } from "@/lib/data";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { ActionsManager } from "@/components/console/ActionsManager";
import { ClipboardList, Shield } from "lucide-react";

export default async function ConsoleActionsPage() {
  const session = await requireRole([
    "viewer",
    "officer",
    "city_admin",
    "state_admin",
  ]);

  const actions = await getActions();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#1F3A5F]/10 dark:bg-[#0E9AA7]/10 px-2 py-0.5 text-xs font-bold text-[#1F3A5F] dark:text-[#0E9AA7] uppercase tracking-wider">
                Field Operations
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Caller: {session.role}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Targeted Mitigation Actions Workflow
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Direct and track mechanical sweepers, anti-smog water cannons, construction pauses, and biomass flying squads.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground max-w-xs flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-[#00B050]" />
            <span>
              All status changes and execution notes are automatically logged to the audit trail.
            </span>
          </div>
        </div>

        <ActionsManager initialActions={actions} userRole={session.role} />
      </main>
    </div>
  );
}
