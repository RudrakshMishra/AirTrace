import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfidenceChipProps {
  score: number; // 0 to 100
  reasons?: string[];
  className?: string;
  showScore?: boolean;
}

export function ConfidenceChip({
  score,
  reasons,
  className,
  showScore = true,
}: ConfidenceChipProps) {
  const t = useTranslations("confidence");

  let level: "high" | "medium" | "low" = "medium";
  let colorClass = "bg-[#00B050]/10 text-[#00B050] border-[#00B050]/30";
  let Icon = ShieldCheck;

  if (score >= 75) {
    level = "high";
    colorClass = "bg-[#00B050]/15 text-[#00B050] border-[#00B050]/30 dark:bg-[#00B050]/20";
    Icon = ShieldCheck;
  } else if (score >= 50) {
    level = "medium";
    colorClass = "bg-[#FFD400]/20 text-[#B45309] border-[#FFD400]/40 dark:text-[#FBBF24] dark:bg-[#FFD400]/15";
    Icon = ShieldAlert;
  } else {
    level = "low";
    colorClass = "bg-[#E03C31]/15 text-[#E03C31] border-[#E03C31]/30 dark:bg-[#E03C31]/20";
    Icon = ShieldX;
  }

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs select-none",
          colorClass
        )}
        title={reasons ? reasons.join(", ") : undefined}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{t(level)}</span>
        {showScore && <span className="font-mono text-[10px]">({score}%)</span>}
      </span>

      {reasons && reasons.length > 0 && (
        <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
