"use client";

import * as React from "react";
import { updateCitySettings } from "@/lib/data/mutations";
import { SlidersHorizontal, Save, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import type { UserRole } from "@/types";

export function SettingsForm({
  userRole,
  userCityId,
}: {
  userRole: UserRole;
  userCityId: string | null;
}) {
  const [cityId, setCityId] = React.useState<string>(userCityId || "bhopal");

  // Threshold states
  const [severeAqi, setSevereAqi] = React.useState(350);
  const [ventilationLimit, setVentilationLimit] = React.useState(1000);
  const [fireRadius, setFireRadius] = React.useState(50);

  // Template states
  const [templateEn, setTemplateEn] = React.useState(
    "Atmospheric inversion trap detected. Ventilation coefficient < 1000 m²/s. Particulate dispersion critically suppressed."
  );
  const [templateHi, setTemplateHi] = React.useState(
    "वायुमंडलीय इनवर्जन ट्रैप दर्ज। वेंटिलेशन गुणांक < 1000 m²/s। कणों का फैलाव अत्यधिक अवरुद्ध।"
  );

  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await updateCitySettings(
      cityId,
      {
        severeAqiThreshold: Number(severeAqi),
        inversionVentilationLimit: Number(ventilationLimit),
        fireBufferRadiusKm: Number(fireRadius),
      },
      {
        trapAlertEn: templateEn,
        trapAlertHi: templateHi,
      }
    );

    setLoading(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message || "Settings updated and versioned in audit log." });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update settings" });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl text-left">
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            feedback.type === "success"
              ? "border-[#00B050]/30 bg-[#00B050]/10 text-[#00B050]"
              : "border-[#E03C31]/30 bg-[#E03C31]/10 text-[#E03C31]"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Target City Selector (state_admin can switch city, city_admin is locked to own city) */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#0E9AA7]" />
          <span>Jurisdiction Target</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
            Configured City
          </label>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={userRole === "city_admin"}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus-visible:ring-2 focus-visible:ring-ring w-64"
          >
            <option value="bhopal">Bhopal (MP State Capital)</option>
            <option value="indore">Indore (Commercial Hub)</option>
            <option value="singrauli">Singrauli (Industrial / Mining)</option>
          </select>
        </div>
      </div>

      {/* Threshold Configuration */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-foreground">
          Automated Emergency Trigger Thresholds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Severe AQI Trigger (CPCB)
            </label>
            <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
              <input
                type="number"
                min={200}
                max={500}
                value={severeAqi}
                onChange={(e) => setSevereAqi(Number(e.target.value))}
                className="w-full bg-transparent font-mono text-sm font-bold text-foreground outline-hidden"
              />
              <span className="text-xs text-muted-foreground font-mono">AQI</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Triggers school outdoor activity suspensions.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Inversion Ventilation Limit
            </label>
            <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
              <input
                type="number"
                min={400}
                max={2500}
                value={ventilationLimit}
                onChange={(e) => setVentilationLimit(Number(e.target.value))}
                className="w-full bg-transparent font-mono text-sm font-bold text-foreground outline-hidden"
              />
              <span className="text-xs text-muted-foreground font-mono">m²/s</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Below this, pollution-trap condition activates.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Fire Hotspot Buffer
            </label>
            <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
              <input
                type="number"
                min={10}
                max={150}
                value={fireRadius}
                onChange={(e) => setFireRadius(Number(e.target.value))}
                className="w-full bg-transparent font-mono text-sm font-bold text-foreground outline-hidden"
              />
              <span className="text-xs text-muted-foreground font-mono">km</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Upwind satellite fire inclusion distance.
            </span>
          </div>
        </div>
      </div>

      {/* Bilingual Alert Message Templates */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-foreground">
          Bilingual Trap Alert Templates (Versioned)
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              English Alert Message Template
            </label>
            <textarea
              rows={2}
              value={templateEn}
              onChange={(e) => setTemplateEn(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Hindi Alert Message Template (हिन्दी)
            </label>
            <textarea
              rows={2}
              value={templateHi}
              onChange={(e) => setTemplateHi(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground font-hindi font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-[#00B050]" />
          <span>Every update increments model version and is signed in the audit log.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A5F] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Municipal Settings</span>
        </button>
      </div>
    </form>
  );
}
