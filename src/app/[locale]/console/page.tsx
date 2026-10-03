import { requireRole } from "@/lib/auth";
import { Link } from "@/i18n/routing";
import { Shield, Users, BarChart3, Radio, ArrowRight } from "lucide-react";
import { IndicativeNotice } from "@/components/ui";
import { ConsoleNav } from "@/components/console/ConsoleNav";

export default async function ConsoleHomePage() {
  // Allow all console roles: viewer, officer, moderator, city_admin, state_admin
  const session = await requireRole([
    "viewer",
    "officer",
    "moderator",
    "city_admin",
    "state_admin",
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#00B050]/10 px-2.5 py-0.5 text-xs font-bold text-[#00B050] uppercase tracking-wider">
              Authenticated Session
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Role: {session.role} • City: {session.cityId || "Statewide"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            AirTrace MP Operator Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Madhya Pradesh Air Quality & Source Attribution Decision Support System
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["state_admin", "city_admin"].includes(session.role) && (
            <Link
              href="/console/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Manage Officers & Roles</span>
            </Link>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-[#0E9AA7]/15 dark:text-[#0E9AA7]">
            <Radio className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            GIS Map & Ward Attribution
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time MapLibre choropleth, thermal fire markers, wind vectors, and dynamic ventilation charts (Phase 5).
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0072B2]/10 text-[#0072B2]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Priority Action Engine
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vulnerability-weighted risk prioritization ranking wards by population density, hospital clusters, and school presence.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00B050]/10 text-[#00B050]">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Administrative Governance
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Role management, verification of field actions, report moderation queues, and compliance audit trail.
          </p>
          {["state_admin", "city_admin"].includes(session.role) && (
            <Link
              href="/console/admin/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E9AA7] hover:underline pt-2"
            >
              <span>User governance portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="pt-4">
        <IndicativeNotice variant="banner" />
      </div>
      </main>
    </div>
  );
}
