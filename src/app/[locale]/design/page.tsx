"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  AqiBadge,
  SourceBar,
  ConfidenceChip,
  StatCard,
  EmptyState,
  Skeleton,
  IndicativeNotice,
} from "@/components/ui";
import {
  Flame,
  Car,
  Wind,
  Factory,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function DesignPage() {
  const t = useTranslations("design");
  const tCommon = useTranslations("common");
  const tAqi = useTranslations("aqi");
  const tSources = useTranslations("sources");
  const tStat = useTranslations("statCard");
  const tEmpty = useTranslations("emptyState");

  const [refreshCount, setRefreshCount] = React.useState(0);

  const sampleSources = {
    fire: 38,
    traffic: 24,
    dust: 18,
    industry: 12,
    other: 8,
  };

  const aqiBands = [
    { value: 35, name: tAqi("good"), color: "#00B050" },
    { value: 85, name: tAqi("satisfactory"), color: "#92D050" },
    { value: 160, name: tAqi("moderate"), color: "#FFD400" },
    { value: 260, name: tAqi("poor"), color: "#F28C28" },
    { value: 360, name: tAqi("veryPoor"), color: "#E03C31" },
    { value: 480, name: tAqi("severe"), color: "#7E0023" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#0E9AA7]/10 px-2.5 py-0.5 text-xs font-bold text-[#0E9AA7] uppercase tracking-wider">
            Design System & UI Tokens
          </span>
          <span className="rounded-md bg-[#F28C28]/10 px-2 py-0.5 text-xs font-semibold text-[#F28C28]">
            {tCommon("demoMode")}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1F3A5F] dark:text-[#F8FAFC]">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Statutory Notice Banner Showcase */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#0E9AA7]" />
          {t("noticesSection")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Banner Format
            </h3>
            <IndicativeNotice variant="banner" />
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Inline Badge Format
            </h3>
            <div className="flex items-center gap-3 pt-2">
              <IndicativeNotice variant="badge" />
            </div>
          </div>
        </div>
      </section>

      {/* AQI Badges & CPCB Scale */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#0E9AA7]" />
          {t("badgesSection")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All CPCB AQI Bands (Standard Size)
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              {aqiBands.map((band) => (
                <AqiBadge key={band.value} value={band.value} size="md" />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Size Variants (sm, md, lg)
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <AqiBadge value={42} size="sm" />
              <AqiBadge value={180} size="md" />
              <AqiBadge value={320} size="lg" />
              <AqiBadge value={450} size="lg" showLabel={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Source Attribution Bar */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Wind className="h-4 w-4 text-[#0E9AA7]" />
          {t("sourcesSection")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Ward 14 (MP Nagar, Bhopal) — Probable Attribution
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                Confidence: 82%
              </span>
            </div>
            <SourceBar shares={sampleSources} />
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Colour-blind Safe Source Tokens Reference
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#D55E00]" />
                  <span className="text-xs font-bold text-foreground">Fires</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#D55E00</span>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#0072B2]" />
                  <span className="text-xs font-bold text-foreground">Traffic</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#0072B2</span>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#E69F00]" />
                  <span className="text-xs font-bold text-foreground">Dust</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#E69F00</span>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#6A3D9A]" />
                  <span className="text-xs font-bold text-foreground">Industry</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#6A3D9A</span>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#7F7F7F]" />
                  <span className="text-xs font-bold text-foreground">Other</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">#7F7F7F</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confidence Chips */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0E9AA7]" />
          {t("confidenceSection")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <ConfidenceChip
                score={88}
                reasons={[
                  "VIIRS satellite fire cluster confirmed upwind",
                  "Wind trajectory directly aligned with ward",
                  "CAAQMS PM2.5 spike matches fire signature",
                ]}
              />
            </div>
            <div className="space-y-2">
              <ConfidenceChip
                score={64}
                reasons={[
                  "Elevated NO2 indicates vehicular traffic contribution",
                  "Interpolated from station 3.2km away",
                ]}
              />
            </div>
            <div className="space-y-2">
              <ConfidenceChip
                score={42}
                reasons={[
                  "Low station density in ward proximity",
                  "Cloud cover obstructing thermal anomaly detection",
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Building className="h-4 w-4 text-[#0E9AA7]" />
          {t("statCardsSection")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={tStat("averageAqi")}
            value={218}
            unit="AQI"
            subtitle="Bhopal Urban Area"
            icon={Activity}
            variant="warning"
            trend={{ value: "+14 pts from yesterday", isPositive: false }}
          />
          <StatCard
            title={tStat("priorityWards")}
            value={7}
            unit="wards"
            subtitle="High vulnerability priority"
            icon={Building}
            variant="danger"
            trend={{ value: "3 with hospital clusters", isPositive: false }}
          />
          <StatCard
            title={tStat("trappedWards")}
            value={4}
            unit="wards"
            subtitle="Atmospheric inversion trap"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title={tStat("activeFires")}
            value={42}
            unit="points"
            subtitle="Within 50km upwind buffer"
            icon={Flame}
            variant="default"
          />
        </div>
      </section>

      {/* Loading Skeletons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-[#0E9AA7]" />
          {t("skeletonsSection")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1 max-w-sm">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </section>

      {/* Empty States */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {t("emptyStatesSection")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title={tEmpty("noDataTitle")}
            description={tEmpty("noDataDesc")}
            action={{
              label: tEmpty("actionButton"),
              onClick: () => setRefreshCount((c) => c + 1),
            }}
          />
          <EmptyState
            title={tEmpty("noActionsTitle")}
            description={tEmpty("noActionsDesc")}
          />
        </div>
      </section>
    </div>
  );
}
