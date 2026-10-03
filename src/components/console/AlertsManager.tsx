"use client";

import * as React from "react";
import type { AlertItemDto } from "@/lib/data/schemas";
import { AlertTriangle, Filter, Radio, BellRing } from "lucide-react";

export function AlertsManager({ initialAlerts }: { initialAlerts: AlertItemDto[] }) {
  const [alerts] = React.useState<AlertItemDto[]>(initialAlerts);
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filtered = alerts.filter((al) => {
    const matchesSev = severityFilter === "all" || al.severity === severityFilter;
    const matchesSearch =
      al.ward_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.message_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      al.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const severityBadges = {
    critical: "bg-[#7E0023]/15 text-[#7E0023] border-[#7E0023]/30 dark:text-[#E03C31]",
    high: "bg-[#E03C31]/15 text-[#E03C31] border-[#E03C31]/30",
    medium: "bg-[#FFD400]/20 text-[#B45309] border-[#FFD400]/40 dark:text-[#FBBF24]",
    low: "bg-[#0E9AA7]/15 text-[#0E9AA7] border-[#0E9AA7]/30",
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by ward, alert type, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3.5">Ward & Time</th>
              <th className="px-4 py-3.5">Alert Classification</th>
              <th className="px-4 py-3.5">Severity</th>
              <th className="px-4 py-3.5">Dispatched Advisory</th>
              <th className="px-4 py-3.5 text-right">Recipients</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No alerts recorded matching the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((al) => {
                const tsFormatted = new Date(al.ts).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                });

                return (
                  <tr key={al.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-foreground block">
                        {al.ward_id}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {tsFormatted}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#F28C28]" />
                        {al.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Channel: {al.channel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          severityBadges[al.severity]
                        }`}
                      >
                        {al.severity}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-lg">
                      <div className="font-semibold text-foreground leading-snug">
                        {al.message_en}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-hindi">
                        {al.message_hi}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono font-bold text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Radio className="h-3 w-3 text-[#0E9AA7]" />
                        {al.recipients_count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
