"use client";

import * as React from "react";
import { moderateReport } from "@/lib/data/mutations";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Camera,
  Loader2,
  Filter,
  Eye,
  X,
} from "lucide-react";

interface ReportItem {
  id: string;
  lat: number;
  lon: number;
  type: string;
  note: string;
  photo_url?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function ReportsModerator({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = React.useState<ReportItem[]>(initialReports);
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [activeModalReport, setActiveModalReport] = React.useState<ReportItem | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const filtered = reports.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  const handleDecision = async (reportId: string, decision: "approved" | "rejected") => {
    setLoadingId(reportId);
    setFeedback(null);

    const res = await moderateReport(reportId, decision);
    setLoadingId(null);

    if (res.success) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: decision } : r))
      );
      setFeedback(`Report marked as ${decision}. Audit trail updated.`);
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback(res.error || "Moderation failed");
    }
  };

  const statusStyles = {
    pending: "bg-[#FFD400]/20 text-[#B45309] border-[#FFD400]/40",
    approved: "bg-[#00B050]/15 text-[#00B050] border-[#00B050]/30",
    rejected: "bg-[#E03C31]/15 text-[#E03C31] border-[#E03C31]/30",
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Queue:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved & Dispatched</option>
            <option value="rejected">Rejected / Spurious</option>
            <option value="all">All Submissions</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground font-mono">
          Showing {filtered.length} reports
        </span>
      </div>

      {feedback && (
        <div className="rounded-xl border border-[#00B050]/30 bg-[#00B050]/10 p-3 text-xs font-semibold text-[#00B050]">
          {feedback}
        </div>
      )}

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3.5">Submission & Type</th>
              <th className="px-4 py-3.5">Citizen Description</th>
              <th className="px-4 py-3.5">GPS Location</th>
              <th className="px-4 py-3.5">Evidence</th>
              <th className="px-4 py-3.5 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No reports in this queue.
                </td>
              </tr>
            ) : (
              filtered.map((report) => {
                const isLoading = loadingId === report.id;
                const dateStr = new Date(report.created_at).toLocaleDateString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                });

                return (
                  <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-foreground block capitalize">
                        {report.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {dateStr}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold uppercase ${
                          statusStyles[report.status]
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-sm">
                      <p className="text-foreground leading-snug">{report.note}</p>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => setActiveModalReport(report)}
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E9AA7] hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {report.lat.toFixed(4)}, {report.lon.toFixed(4)}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {report.photo_url ? (
                        <button
                          onClick={() => setActiveModalReport(report)}
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/80"
                        >
                          <Camera className="h-3 w-3" />
                          <span>View Photo</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">
                          No Photo
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {report.status === "pending" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDecision(report.id, "approved")}
                            disabled={isLoading}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#00B050] px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#00B050]/90 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleDecision(report.id, "rejected")}
                            disabled={isLoading}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#E03C31] px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#E03C31]/90 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />}
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                          Resolved ({report.status})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Map Pin / Evidence Modal */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <button
              onClick={() => setActiveModalReport(null)}
              type="button"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Incident Location & Evidence
              </h3>
              <p className="text-xs text-muted-foreground">
                Coordinates: {activeModalReport.lat.toFixed(5)}, {activeModalReport.lon.toFixed(5)}
              </p>
            </div>

            {/* Static OSM Embed Preview for verification */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center space-y-2">
              <MapPin className="h-8 w-8 text-[#E03C31] mx-auto" />
              <div className="text-xs font-bold text-foreground">
                Pinned at Lat: {activeModalReport.lat}, Lon: {activeModalReport.lon}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {activeModalReport.note}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModalReport(null)}
                type="button"
                className="rounded-xl bg-[#1F3A5F] px-4 py-2 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
