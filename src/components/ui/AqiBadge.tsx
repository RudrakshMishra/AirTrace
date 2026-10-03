import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface AqiBadgeProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function getAqiBand(value: number) {
  if (value <= 50) {
    return {
      key: "good",
      color: "#00B050",
      textColor: "#FFFFFF",
      bgClass: "bg-[#00B050]",
      borderClass: "border-[#00B050]",
    };
  }
  if (value <= 100) {
    return {
      key: "satisfactory",
      color: "#92D050",
      textColor: "#0F172A",
      bgClass: "bg-[#92D050]",
      borderClass: "border-[#92D050]",
    };
  }
  if (value <= 200) {
    return {
      key: "moderate",
      color: "#FFD400",
      textColor: "#0F172A",
      bgClass: "bg-[#FFD400]",
      borderClass: "border-[#FFD400]",
    };
  }
  if (value <= 300) {
    return {
      key: "poor",
      color: "#F28C28",
      textColor: "#FFFFFF",
      bgClass: "bg-[#F28C28]",
      borderClass: "border-[#F28C28]",
    };
  }
  if (value <= 400) {
    return {
      key: "veryPoor",
      color: "#E03C31",
      textColor: "#FFFFFF",
      bgClass: "bg-[#E03C31]",
      borderClass: "border-[#E03C31]",
    };
  }
  return {
    key: "severe",
    color: "#7E0023",
    textColor: "#FFFFFF",
    bgClass: "bg-[#7E0023]",
    borderClass: "border-[#7E0023]",
  };
}

export function AqiBadge({
  value,
  className,
  size = "md",
  showLabel = true,
}: AqiBadgeProps) {
  const t = useTranslations("aqi");
  const band = getAqiBand(value);
  const label = t(band.key as any);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-sm font-bold gap-1.5",
    lg: "px-4 py-2 text-lg font-black gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-mono shadow-sm transition-transform select-none",
        band.bgClass,
        sizeClasses[size],
        className
      )}
      style={{ color: band.textColor }}
      role="status"
      aria-label={`Air Quality Index: ${value}, ${label}`}
    >
      <span>{value}</span>
      {showLabel && (
        <span className="font-sans text-xs font-medium opacity-95">
          {label}
        </span>
      )}
    </span>
  );
}
