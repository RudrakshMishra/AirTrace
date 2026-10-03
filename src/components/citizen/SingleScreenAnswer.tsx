"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Baby,
  HeartPulse,
  UserCheck,
  Share2,
  Check,
  Flame,
  Car,
  Wind,
  Factory,
  CircleDot,
  AlertTriangle,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { AqiBadge, IndicativeNotice, SourceBar } from "@/components/ui";
import { Forecast24hChart } from "./Forecast24hChart";
import type { WardDto, WardStateDto } from "@/lib/data/schemas";

export function SingleScreenAnswer({
  ward,
  state,
  timeline,
  largeText,
  lowBandwidth,
}: {
  ward: WardDto;
  state: WardStateDto | null;
  timeline: WardStateDto[];
  largeText: boolean;
  lowBandwidth: boolean;
}) {
  const t = useTranslations("citizen");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [copied, setCopied] = React.useState(false);

  const aqiValue = state?.aqi_est || 185;

  // Determine dominant source
  const sourceShares = {
    fire: state?.src_fire || 35,
    traffic: state?.src_traffic || 25,
    dust: state?.src_dust || 20,
    industry: state?.src_industry || 12,
    other: state?.src_other || 8,
  };

  const dominantSource = React.useMemo(() => {
    const entries = Object.entries(sourceShares) as [keyof typeof sourceShares, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries[0];

    const labels: Record<string, { en: string; hi: string; icon: any; color: string }> = {
      fire: { en: "Biomass & Waste Fires", hi: "आग / पराली / बायोमास", icon: Flame, color: "#D55E00" },
      traffic: { en: "Vehicular Emissions", hi: "वाहनों का धुआं", icon: Car, color: "#0072B2" },
      dust: { en: "Road & Construction Dust", hi: "सड़क व निर्माण धूल", icon: Wind, color: "#E69F00" },
      industry: { en: "Industrial Smoke", hi: "औद्योगिक उत्सर्जन", icon: Factory, color: "#6A3D9A" },
      other: { en: "Background & Other", hi: "अन्य / पृष्ठभूमि", icon: CircleDot, color: "#7F7F7F" },
    };

    return {
      key: top[0],
      pct: top[1],
      ...labels[top[0]],
    };
  }, [sourceShares]);

  const DominantIcon = dominantSource.icon;

  const handleShare = async () => {
    const shareData = {
      title: `${locale === "hi" ? ward.name_hi : ward.name} AQI: ${aqiValue}`,
      text: `${t("shareText")} — ${locale === "hi" ? ward.name_hi : ward.name}: AQI ${aqiValue}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback or cancel
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Today's AQI Hero Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {locale === "hi" ? "चयनित वार्ड" : "Selected Ward"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {locale === "hi" ? ward.name_hi : ward.name}
            </h2>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tCommon("lastUpdated")}: {new Date().toLocaleTimeString(locale === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AqiBadge value={aqiValue} size="lg" />
            <a
              href={`/api/pdf?wardId=${ward.id}&lang=${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 text-xs font-bold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label={locale === "hi" ? "वार्ड पीडीएफ रिपोर्ट डाउनलोड करें" : "Download Ward PDF Report"}
              title={locale === "hi" ? "वार्ड पीडीएफ रिपोर्ट" : "Download PDF Report"}
            >
              <FileDown className="h-4 w-4 text-[#0E9AA7]" />
              <span className="hidden sm:inline">{locale === "hi" ? "पीडीएफ" : "PDF"}</span>
            </a>
            <button
              onClick={handleShare}
              type="button"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3.5 text-xs font-bold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label={t("shareButton")}
            >
              {copied ? <Check className="h-4 w-4 text-[#00B050]" /> : <Share2 className="h-4 w-4" />}
              <span>{copied ? t("copied") : t("shareButton")}</span>
            </button>
          </div>
        </div>

        {/* 2. Main Likely Cause */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("mainCause")}
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
              style={{ backgroundColor: dominantSource.color }}
            >
              <DominantIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-base text-foreground truncate">
                  {locale === "hi" ? dominantSource.hi : dominantSource.en}
                </span>
                <span className="font-mono text-sm font-extrabold text-foreground ml-2">
                  ~{dominantSource.pct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {tCommon("indicativeNotice")}
              </p>
            </div>
          </div>

          {!lowBandwidth && <SourceBar shares={sourceShares} showNotice={false} />}
        </div>

        {/* 3. Who is at risk */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("whoIsAtRisk")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#E03C31]/30 bg-[#E03C31]/10 p-3">
              <Baby className="h-5 w-5 shrink-0 text-[#E03C31]" />
              <span className={`font-bold text-foreground ${largeText ? "text-sm" : "text-xs"}`}>
                {t("riskChildren")}
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3">
              <UserCheck className="h-5 w-5 shrink-0 text-[#F28C28]" />
              <span className={`font-bold text-foreground ${largeText ? "text-sm" : "text-xs"}`}>
                {t("riskElderly")}
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#E03C31]/30 bg-[#E03C31]/10 p-3">
              <HeartPulse className="h-5 w-5 shrink-0 text-[#E03C31]" />
              <span className={`font-bold text-foreground ${largeText ? "text-sm" : "text-xs"}`}>
                {t("riskAsthma")}
              </span>
            </div>
          </div>
        </div>

        {/* 4. 3 Simple Advice Lines */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00B050] flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-[#F28C28]" />
            {t("adviceTitle")}
          </span>
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F3A5F] text-[10px] font-bold text-white dark:bg-[#0E9AA7]">
                1
              </span>
              <p className={`text-foreground ${largeText ? "text-base font-semibold" : "text-sm"}`}>
                {t("advice1")}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F3A5F] text-[10px] font-bold text-white dark:bg-[#0E9AA7]">
                2
              </span>
              <p className={`text-foreground ${largeText ? "text-base font-semibold" : "text-sm"}`}>
                {t("advice2")}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F3A5F] text-[10px] font-bold text-white dark:bg-[#0E9AA7]">
                3
              </span>
              <p className={`text-foreground ${largeText ? "text-base font-semibold" : "text-sm"}`}>
                {t("advice3")}
              </p>
            </div>
          </div>
        </div>

        {/* 5. 24 Hours Forecast Trend */}
        {!lowBandwidth ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#0E9AA7]" />
                {t("trend24h")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Hourly Projection
              </span>
            </div>
            <Forecast24hChart timeline={timeline} largeText={largeText} />
          </div>
        ) : (
          <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground italic">
            [Low-bandwidth mode active: visual chart suppressed to save data]
          </div>
        )}

        <div className="pt-2">
          <IndicativeNotice variant="banner" className="text-[11px]" />
        </div>
      </div>
    </div>
  );
}
