import * as React from "react";
import { useTranslations } from "next-intl";
import { Flame, Car, Wind, Factory, CircleDot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SourceShares {
  fire: number;
  traffic: number;
  dust: number;
  industry: number;
  other: number;
}

export interface SourceBarProps {
  shares: SourceShares;
  className?: string;
  showLegend?: boolean;
  showNotice?: boolean;
}

export function SourceBar({
  shares,
  className,
  showLegend = true,
  showNotice = true,
}: SourceBarProps) {
  const t = useTranslations("sources");
  const tCommon = useTranslations("common");

  const sources = [
    {
      key: "fire",
      label: t("fire"),
      value: shares.fire,
      color: "#D55E00",
      bgClass: "bg-[#D55E00]",
      icon: Flame,
    },
    {
      key: "traffic",
      label: t("traffic"),
      value: shares.traffic,
      color: "#0072B2",
      bgClass: "bg-[#0072B2]",
      icon: Car,
    },
    {
      key: "dust",
      label: t("dust"),
      value: shares.dust,
      color: "#E69F00",
      bgClass: "bg-[#E69F00]",
      icon: Wind,
    },
    {
      key: "industry",
      label: t("industry"),
      value: shares.industry,
      color: "#6A3D9A",
      bgClass: "bg-[#6A3D9A]",
      icon: Factory,
    },
    {
      key: "other",
      label: t("other"),
      value: shares.other,
      color: "#7F7F7F",
      bgClass: "bg-[#7F7F7F]",
      icon: CircleDot,
    },
  ];

  const total = sources.reduce((acc, s) => acc + s.value, 0) || 100;

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {/* Stacked Progress Bar */}
      <div
        className="flex h-4 w-full overflow-hidden rounded-md bg-muted/60 shadow-inner"
        role="meter"
        aria-label="Pollution source attribution distribution"
      >
        {sources.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          if (pct <= 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="h-full transition-all duration-300 relative group"
              title={`${s.label}: ${pct}%`}
            />
          );
        })}
      </div>

      {/* Colour-blind safe legend with icons and percentages */}
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          {sources.map((s) => {
            const Icon = s.icon;
            const pct = Math.round((s.value / total) * 100);
            return (
              <div
                key={s.key}
                className="flex items-center gap-1.5 rounded-md p-1 bg-card border border-border/60 shadow-xs"
              >
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white"
                  style={{ backgroundColor: s.color }}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[11px] font-medium text-foreground">
                    {s.label}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Statutory Notice */}
      {showNotice && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 italic pt-0.5">
          <AlertTriangle className="h-3 w-3 text-[#F28C28] shrink-0" />
          <span>{tCommon("indicativeNotice")}</span>
        </div>
      )}
    </div>
  );
}
