"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Flame, Layers, Clock } from "lucide-react";

export function LiveStatsStrip() {
  const t = useTranslations("stats");

  const stats = [
    {
      value: "60",
      unit: "Wards",
      label: t("wardsTracked"),
      icon: Layers,
      color: "text-[#0E9AA7]",
      bg: "bg-[#0E9AA7]/10",
    },
    {
      value: "5",
      unit: "Sectors",
      label: t("activeSources"),
      icon: ShieldCheck,
      color: "text-[#1F3A5F] dark:text-[#F8FAFC]",
      bg: "bg-[#1F3A5F]/10 dark:bg-card",
    },
    {
      value: "1,440",
      unit: "Models/Day",
      label: t("hourlyUpdates"),
      icon: Clock,
      color: "text-[#F28C28]",
      bg: "bg-[#F28C28]/10",
    },
    {
      value: "150+",
      unit: "Hotspots",
      label: t("citizenAlerts"),
      icon: Flame,
      color: "text-[#D55E00]",
      bg: "bg-[#D55E00]/10",
    },
  ];

  return (
    <section className="relative -mt-6 sm:-mt-10 z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card/90 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {stat.unit}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
