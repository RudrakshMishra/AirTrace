"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bell, Lock, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

export function SubscribeDialog({
  wardId,
  isOpen,
  onClose,
  largeText,
}: {
  wardId: string;
  isOpen: boolean;
  onClose: () => void;
  largeText: boolean;
}) {
  const t = useTranslations("citizen");
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMessage("Please check the consent box to proceed.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ward_id: wardId,
          language: "hi",
        }),
      });

      const json = await res.json();
      setLoading(false);

      if (json.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(json.error || "Failed to subscribe");
      }
    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      setErrorMessage(err.message || "Network error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E9AA7]/10 text-[#0E9AA7]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`font-black text-foreground ${largeText ? "text-xl" : "text-lg"}`}>
              {t("subscribeTitle")}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Ward: {wardId}
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl border border-[#00B050]/30 bg-[#00B050]/10 p-5 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-[#00B050] mx-auto" />
            <p className="text-sm font-bold text-foreground">
              {t("subscribeSuccess")}
            </p>
            <button
              onClick={onClose}
              type="button"
              className="mt-2 rounded-xl bg-[#00B050] px-4 py-2 text-xs font-bold text-white shadow-xs"
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
                {t("phoneLabel")}
              </label>
              <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
                <span className="text-xs font-bold text-muted-foreground mr-2 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-transparent font-mono outline-hidden text-foreground ${
                    largeText ? "text-lg" : "text-sm"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="consent-check"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-[#0E9AA7] focus:ring-[#0E9AA7]"
              />
              <label
                htmlFor="consent-check"
                className={`text-xs text-muted-foreground leading-snug cursor-pointer select-none ${
                  largeText ? "text-sm" : "text-xs"
                }`}
              >
                {t("consentLabel")}
              </label>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#00B050] mt-0.5" />
              <span>{t("privacyNotice")}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E9AA7] py-3 font-bold text-white shadow-md hover:bg-[#0E9AA7]/90 active:scale-[0.98] disabled:opacity-50 transition-all ${
                largeText ? "text-base" : "text-sm"
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? t("subscribing") : t("subscribeBtn")}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
