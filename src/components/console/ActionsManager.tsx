"use client";

import * as React from "react";
import { updateActionStatus } from "@/lib/data/mutations";
import type { RecommendedActionDto } from "@/lib/data/schemas";
import type { UserRole } from "@/types";
import { canUpdateActions } from "@/lib/auth/roles";
import {
  CheckCircle2,
  Clock,
  CircleDot,
  Loader2,
  Save,
  Filter,
  PlusCircle,
} from "lucide-react";

export function ActionsManager({
  initialActions,
  userRole,
}: {
  initialActions: RecommendedActionDto[];
  userRole: UserRole;
} ) {
  const [actions, setActions] = React.useState<RecommendedActionDto[]>(initialActions);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [noteInputs, setNoteInputs] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const isEditable = canUpdateActions(userRole);

  const filtered = actions.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch =
      a.text_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ward_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (
    actionId: string,
    newStatus: "open" | "in_progress" | "done"
  ) => {
    setLoadingId(actionId);
    setFeedback(null);
    const note = noteInputs[actionId];

    const res = await updateActionStatus(actionId, newStatus, note);
    setLoadingId(null);

    if (res.success) {
      setActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? { ...a, status: newStatus, note: note || a.note }
            : a
        )
      );
      setFeedback(res.message || "Action updated");
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback(res.error || "Update failed");
    }
  };

  const statusBadges = {
    open: "bg-[#FFD400]/20 text-[#B45309] border-[#FFD400]/40",
    in_progress: "bg-[#0E9AA7]/15 text-[#0E9AA7] border-[#0E9AA7]/30",
    done: "bg-[#00B050]/15 text-[#00B050] border-[#00B050]/30",
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by ward, department, or action text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Actions ({actions.length})</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-[#00B050]/30 bg-[#00B050]/10 p-3 text-xs font-semibold text-[#00B050]">
          {feedback}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3.5">Ward & Department</th>
              <th className="px-4 py-3.5">Action Directive</th>
              <th className="px-4 py-3.5">Current Status</th>
              <th className="px-4 py-3.5">Field Execution Notes</th>
              {isEditable && <th className="px-4 py-3.5 text-right">Workflow</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No actions found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((action) => {
                const isLoading = loadingId === action.id;

                return (
                  <tr key={action.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-foreground block">
                        {action.ward_id}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {action.department}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-md">
                      <div className="font-semibold text-foreground leading-snug">
                        {action.text_en}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-hindi">
                        {action.text_hi}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          statusBadges[action.status]
                        }`}
                      >
                        {action.status === "done" && <CheckCircle2 className="h-3 w-3" />}
                        {action.status === "in_progress" && <Clock className="h-3 w-3" />}
                        {action.status === "open" && <CircleDot className="h-3 w-3" />}
                        <span>{action.status.replace("_", " ")}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {isEditable ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Add execution note..."
                            defaultValue={action.note || ""}
                            onChange={(e) =>
                              setNoteInputs((prev) => ({
                                ...prev,
                                [action.id]: e.target.value,
                              }))
                            }
                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground w-48"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">
                          {action.note || "No note recorded"}
                        </span>
                      )}
                    </td>

                    {isEditable && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {action.status !== "in_progress" && (
                            <button
                              onClick={() => handleStatusChange(action.id, "in_progress")}
                              disabled={isLoading}
                              type="button"
                              className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}
                          {action.status !== "done" && (
                            <button
                              onClick={() => handleStatusChange(action.id, "done")}
                              disabled={isLoading}
                              type="button"
                              className="rounded-lg bg-[#00B050] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#00B050]/90 disabled:opacity-50"
                            >
                              Mark Done
                            </button>
                          )}
                          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
                        </div>
                      </td>
                    )}
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
