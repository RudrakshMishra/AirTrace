"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Camera, MapPin, CheckCircle2, AlertCircle, Loader2, X, AlertTriangle } from "lucide-react";

export function CommunityReportDialog({
  isOpen,
  onClose,
  defaultLat,
  defaultLon,
  largeText,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultLat: number;
  defaultLon: number;
  largeText: boolean;
}) {
  const t = useTranslations("citizen");
  const [type, setType] = React.useState<string>("garbage_burning");
  const [note, setNote] = React.useState("");
  const [lat, setLat] = React.useState(defaultLat);
  const [lon, setLon] = React.useState(defaultLon);
  const [photoSelected, setPhotoSelected] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: Number(lat),
          lon: Number(lon),
          type,
          note,
          photo_url: photoSelected ? "https://airtrace.mp.gov.in/demo-upload.jpg" : undefined,
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (json.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(json.error || "Failed to submit report");
      }
    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      setErrorMessage(err.message || "Network error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F28C28]/10 text-[#F28C28]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`font-black text-foreground ${largeText ? "text-xl" : "text-lg"}`}>
              {t("reportTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              Notify MPPCB & municipal enforcement squad
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl border border-[#00B050]/30 bg-[#00B050]/10 p-5 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-[#00B050] mx-auto" />
            <p className="text-sm font-bold text-foreground">
              {t("reportSuccess")}
            </p>
            <button
              onClick={onClose}
              type="button"
              className="mt-3 rounded-xl bg-[#00B050] px-5 py-2 text-xs font-bold text-white shadow-xs"
            >
              OK
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl border border-[#E03C31]/30 bg-[#E03C31]/10 p-3 text-xs text-[#E03C31]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t("reportTypeLabel")}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground font-medium focus-visible:ring-2 focus-visible:ring-ring ${
                  largeText ? "text-base py-2.5" : "text-sm"
                }`}
              >
                <option value="garbage_burning">{t("typeGarbage")}</option>
                <option value="construction_dust">{t("typeDust")}</option>
                <option value="industrial_smoke">{t("typeIndustry")}</option>
                <option value="vehicular">{t("typeVehicular")}</option>
                <option value="other">{t("typeOther")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t("reportNoteLabel")}
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="उदा. करौंद मंडी के पास खुले में कचरा जलाया जा रहा है..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
                  largeText ? "text-base" : "text-sm"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border">
              <MapPin className="h-4 w-4 text-[#0E9AA7] shrink-0" />
              <span className="font-mono text-[11px] truncate">
                Pin: {lat.toFixed(4)}, {lon.toFixed(4)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t("photoLabel")}
              </label>
              <label
                htmlFor="photo-upload-input"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3.5 text-xs font-medium transition-colors ${
                  photoSelected
                    ? "border-[#00B050] bg-[#00B050]/10 text-[#00B050]"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>
                  {photoSelected
                    ? "✓ Photo attached (ready to submit)"
                    : "Click to take / attach photo (JPG, PNG, WebP max 5MB)"}
                </span>
              </label>
              <input
                id="photo-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    setStatus("error");
                    setErrorMessage("Photo size must be less than 5MB");
                    return;
                  }
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    setStatus("error");
                    setErrorMessage("Only JPG, PNG, and WebP images are allowed");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPhotoSelected(true);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3A5F] py-3 font-bold text-white shadow-md hover:bg-[#1F3A5F]/90 active:scale-[0.98] disabled:opacity-50 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 transition-all ${
                largeText ? "text-base" : "text-sm"
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? t("submitting") : t("submitReport")}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
