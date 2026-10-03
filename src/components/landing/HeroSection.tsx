"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { WindCanvas } from "./WindCanvas";
import { ArrowRight, ShieldCheck, Compass, Lock, MapPin } from "lucide-react";
import { AqiBadge } from "@/components/ui";

export function HeroSection() {
  const t = useTranslations("hero");
  const tCommon = useTranslations("common");

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-background/95 to-muted/20 py-20 sm:py-28 lg:py-32">
      {/* Decorative Background Elements */}
      <WindCanvas />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-[#0E9AA7]/10 blur-3xl dark:bg-[#0E9AA7]/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 right-[-10%] h-80 w-80 rounded-full bg-[#F28C28]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Civic Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs">
          <ShieldCheck className="h-4 w-4 text-[#0E9AA7]" />
          <span>{tCommon("govName")}</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-[#0E9AA7] font-bold">{t("badge")}</span>
        </div>

        {/* Headline & Subheading */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[#1F3A5F] dark:text-[#F8FAFC] leading-[1.15]">
            {t("headline")}
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/citizen"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E9AA7] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#0E9AA7]/90 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Compass className="h-4 w-4" />
            <span>{t("openCitizen")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/console"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/90 px-6 py-3.5 text-sm font-bold text-foreground shadow-xs hover:bg-muted active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Lock className="h-4 w-4 text-[#1F3A5F] dark:text-[#0E9AA7]" />
            <span>{t("officerLogin")}</span>
          </Link>
        </div>

        {/* Live City Badge Pill */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#0E9AA7]" />
            {t("trustedBy")}:
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-card border border-border/80 px-2.5 py-1 font-medium text-foreground flex items-center gap-1.5 shadow-2xs">
              <span>Bhopal</span>
              <AqiBadge value={184} size="sm" showLabel={false} />
            </span>
            <span className="rounded-lg bg-card border border-border/80 px-2.5 py-1 font-medium text-foreground flex items-center gap-1.5 shadow-2xs">
              <span>Indore</span>
              <AqiBadge value={212} size="sm" showLabel={false} />
            </span>
            <span className="rounded-lg bg-card border border-border/80 px-2.5 py-1 font-medium text-foreground flex items-center gap-1.5 shadow-2xs">
              <span>Singrauli</span>
              <AqiBadge value={328} size="sm" showLabel={false} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
