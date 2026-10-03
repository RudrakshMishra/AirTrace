"use client";

import * as React from "react";
import type { AuditLogRow } from "@/types";
import { Download, Filter, ScrollText, ShieldAlert } from "lucide-react";

export function AuditLogViewer({ initialLogs }: { initialLogs: AuditLogRow[] }) {
  const [logs] = React.useState<AuditLogRow[]>(initialLogs);
  const [filterAction, setFilterAction] = React.useState<string>("all");
  const [searchActor, setSearchActor] = React.useState<string>("");

  const filtered = logs.filter((log) => {
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesActor =
      log.actor_clerk_id.toLowerCase().includes(searchActor.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchActor.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchActor.toLowerCase());
    return matchesAction && matchesActor;
  });

  const exportCSV = () => {
    const headers = ["Timestamp", "Log ID", "Actor ID", "Action", "Entity", "Entity ID", "Metadata"];
    const rows = filtered.map((l) => [
      l.ts,
      l.id,
      l.actor_clerk_id,
      l.action,
      l.entity,
      l.entity_id,
      JSON.stringify(l.meta_json).replace(/"/g, '""'),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => `"${e.join('","')}"`)].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `airtrace_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by actor ID, entity, or ID..."
            value={searchActor}
            onChange={(e) => setSearchActor(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Actions ({logs.length})</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={exportCSV}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1F3A5F] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3.5">Timestamp</th>
              <th className="px-4 py-3.5">Actor (Clerk ID)</th>
              <th className="px-4 py-3.5">Action Executed</th>
              <th className="px-4 py-3.5">Target Entity</th>
              <th className="px-4 py-3.5">Audit Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-sans text-xs">
                  No audit trail records found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const dateStr = new Date(log.ts).toLocaleString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {dateStr}
                    </td>

                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      {log.actor_clerk_id}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-[#0E9AA7]/10 px-2 py-0.5 font-bold text-[#0E9AA7]">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      {log.entity}:{log.entity_id}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.meta_json)}
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
