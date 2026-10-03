"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Type, WifiOff, Shield, Languages } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";

export function CitizenHeader({
  largeText,
  setLargeText,
  lowBandwidth,
  setLowBandwidth,
}: {
  largeText: boolean;
  setLargeText: (v: boolean | ((prev: boolean) => boolean)) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const t = useTranslations("citizen");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "hi" ? "en" : "hi";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-[#0E9AA7]/10 px-2 py-0.5 text-[11px] font-bold text-[#0E9AA7] uppercase tracking-wider">
            <Shield className="h-3 w-3" />
            {tCommon("govName")}
          </span>
          <span className="rounded bg-[#F28C28]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#F28C28]">
            {tCommon("demoMode")}
          </span>
        </div>
        <h1
          className={`font-black tracking-tight text-[#1F3A5F] dark:text-[#F8FAFC] ${
            largeText ? "text-3xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {t("title")}
        </h1>
        <p
          className={`text-muted-foreground ${
            largeText ? "text-base" : "text-xs sm:text-sm"
          }`}
        >
          {t("subtitle")}
        </p>
      </div>

      {/* Accessibility & Bandwidth Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setLargeText((v) => !v)}
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            largeText
              ? "border-[#0E9AA7] bg-[#0E9AA7]/15 text-[#0E9AA7]"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
          aria-pressed={largeText}
          title={t("largeText")}
        >
          <Type className="h-3.5 w-3.5" />
          <span>{t("largeText")}</span>
        </button>

        <button
          onClick={() => setLowBandwidth((v) => !v)}
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            lowBandwidth
              ? "border-[#F28C28] bg-[#F28C28]/15 text-[#F28C28]"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
          aria-pressed={lowBandwidth}
          title={t("lowBandwidth")}
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>{t("lowBandwidth")}</span>
        </button>

        <button
          onClick={toggleLanguage}
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Languages className="h-3.5 w-3.5 text-[#0E9AA7]" />
          <span>{locale === "hi" ? "English" : "हिन्दी"}</span>
        </button>
      </div>
    </div>
  );
}
