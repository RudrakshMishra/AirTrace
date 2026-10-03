import { requireRole } from "@/lib/auth";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { ReportsModerator } from "@/components/console/ReportsModerator";
import { FileCheck2, Shield } from "lucide-react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function ConsoleReportsPage() {
  const session = await requireRole(["moderator", "city_admin", "state_admin"]);

  // Default sample reports for demo
  let reportsList: {
    id: string;
    lat: number;
    lon: number;
    type: string;
    note: string;
    photo_url?: string | null;
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }[] = [
    {
      id: "rep-01",
      lat: 23.2755,
      lon: 77.4192,
      type: "garbage_burning",
      note: "Illegal burning of municipal plastic waste near Karond Sabzi Mandi.",
      photo_url: "https://airtrace.mp.gov.in/demo.jpg",
      status: "pending" as const,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "rep-02",
      lat: 23.2312,
      lon: 77.4354,
      type: "construction_dust",
      note: "Major commercial construction without wind-breaking dust screens.",
      status: "pending" as const,
      created_at: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: "rep-03",
      lat: 22.7214,
      lon: 75.8643,
      type: "industrial_smoke",
      note: "Dark continuous boiler emissions visible from Sanwer Road sector.",
      status: "approved" as const,
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  if (db) {
    try {
      const dbReports = await db
        .select()
        .from(schema.reports)
        .orderBy(desc(schema.reports.created_at))
        .limit(50);

      if (dbReports.length > 0) {
        reportsList = dbReports.map((r) => ({
          id: r.id,
          lat: Number(r.lat),
          lon: Number(r.lon),
          type: r.type,
          note: r.note,
          photo_url: r.photo_url,
          status: r.status as "pending" | "approved" | "rejected",
          created_at: r.created_at.toISOString(),
        }));
      }
    } catch (e) {
      console.warn("DB reports query error:", e);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#00B050]/10 px-2 py-0.5 text-xs font-bold text-[#00B050] uppercase tracking-wider">
                Moderation Queue
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Caller: {session.role}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Citizen Air Quality Incident Verification
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Verify grassroots citizen reports of open burning, dust violations, and smoke plumes prior to field squad dispatch.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground max-w-xs flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-[#0E9AA7]" />
            <span>
              Every approved report directly dispatches municipal flying squads and records an audit log.
            </span>
          </div>
        </div>

        <ReportsModerator initialReports={reportsList} />
      </main>
    </div>
  );
}
