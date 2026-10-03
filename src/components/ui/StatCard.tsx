import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "border-border/80 bg-card text-card-foreground",
    warning: "border-[#FFD400]/40 bg-[#FFD400]/5 text-card-foreground",
    danger: "border-[#E03C31]/40 bg-[#E03C31]/5 text-card-foreground",
    success: "border-[#00B050]/40 bg-[#00B050]/5 text-card-foreground",
  };

  const iconColors = {
    default: "text-[#0E9AA7] bg-[#0E9AA7]/10",
    warning: "text-[#F28C28] bg-[#F28C28]/10",
    danger: "text-[#E03C31] bg-[#E03C31]/10",
    success: "text-[#00B050] bg-[#00B050]/10",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-xs transition-all hover:shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconColors[variant]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.isPositive ? "text-[#00B050]" : "text-[#E03C31]"
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
