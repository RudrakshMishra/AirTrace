import { requireRole } from "@/lib/auth";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { AuditLogViewer } from "@/components/console/AuditLogViewer";
import { getAuditLogs } from "@/lib/data/mutations";
import { ScrollText, ShieldAlert } from "lucide-react";

export default async function ConsoleAuditPage() {
  // STRICT server-side check: state_admin only
  const session = await requireRole(["state_admin"]);

  const logs = await getAuditLogs();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#E03C31]/10 px-2 py-0.5 text-xs font-bold text-[#E03C31] uppercase tracking-wider">
                State Administrator Only
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Caller: {session.role}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Compliance & Security Audit Trail
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Immutable ledger of all administrative mutations, user promotions, report moderations, and threshold updates.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground max-w-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-[#E03C31]" />
            <span>
              All transactions are cryptographically recorded and tamper-evident for statutory compliance.
            </span>
          </div>
        </div>

        <AuditLogViewer initialLogs={logs} />
      </main>
    </div>
  );
}
