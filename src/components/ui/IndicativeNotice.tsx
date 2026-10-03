import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IndicativeNoticeProps {
  className?: string;
  variant?: "badge" | "banner";
}

export function IndicativeNotice({
  className,
  variant = "badge",
}: IndicativeNoticeProps) {
  const t = useTranslations("common");

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-xs text-foreground",
          className
        )}
        role="note"
      >
        <Scale className="h-4 w-4 shrink-0 text-[#F28C28]" />
        <div>
          <span className="font-semibold text-[#F28C28] mr-1.5 uppercase tracking-wider text-[10px]">
            Statutory Notice:
          </span>
          <span className="text-muted-foreground">{t("indicativeNotice")}</span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground font-medium",
        className
      )}
      role="note"
    >
      <AlertCircle className="h-3 w-3 text-[#F28C28] shrink-0" />
      <span>{t("indicativeNotice")}</span>
    </span>
  );
}
