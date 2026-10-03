"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "hi" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      aria-label={`Switch to ${locale === "en" ? "Hindi" : "English"}`}
    >
      <Languages className="h-3.5 w-3.5 text-secondary" />
      <span>{locale === "en" ? "हिन्दी" : "English"}</span>
    </button>
  );
}
