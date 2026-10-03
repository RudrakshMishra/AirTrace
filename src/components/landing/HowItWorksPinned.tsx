"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Database, Compass, Target, CheckCircle2, Flame, Wind, Activity, Bell } from "lucide-react";
import { AqiBadge, SourceBar } from "@/components/ui";

export function HowItWorksPinned() {
  const t = useTranslations("howItWorks");
  const [activeStep, setActiveStep] = React.useState(0);

  const steps = [
    {
      id: "collect",
      icon: Database,
      title: t("step1Title"),
      desc: t("step1Desc"),
      color: "#0E9AA7",
    },
    {
      id: "trace",
      icon: Compass,
      title: t("step2Title"),
      desc: t("step2Desc"),
      color: "#1F3A5F",
    },
    {
      id: "prioritize",
      icon: Target,
      title: t("step3Title"),
      desc: t("step3Desc"),
      color: "#F28C28",
    },
    {
      id: "act",
      icon: CheckCircle2,
      title: t("step4Title"),
      desc: t("step4Desc"),
      color: "#00B050",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="rounded-full bg-[#0E9AA7]/10 px-3 py-1 text-xs font-bold text-[#0E9AA7] uppercase tracking-wider">
            {t("tag")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Steps Navigation */}
          <div className="lg:col-span-5 space-y-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  type="button"
                  className={`w-full text-left rounded-2xl p-5 border transition-all duration-200 ${
                    isActive
                      ? "border-[#0E9AA7] bg-card shadow-md scale-[1.01]"
                      : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs`}
                      style={{ backgroundColor: step.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-12">
                    {step.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Changing Visual Representation Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-md min-h-[380px] flex flex-col justify-center transition-all duration-300">
              {activeStep === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0E9AA7]">
                      Ingestion Pipeline • Step 1
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Status: Active Sync
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Activity className="h-4 w-4 text-[#0E9AA7]" />
                        <span>CAAQMS Stations</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        PM2.5, PM10, NO2, SO2 hourly telemetry
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Flame className="h-4 w-4 text-[#D55E00]" />
                        <span>VIIRS / MODIS</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        150+ thermal agricultural & forest fire anomalies
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Wind className="h-4 w-4 text-[#0072B2]" />
                        <span>ERA5 Wind Trajectories</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Speed, direction, and planetary boundary layer
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Database className="h-4 w-4 text-[#6A3D9A]" />
                        <span>Municipal GIS Wards</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Population density, schools, and hospitals
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F] dark:text-[#0E9AA7]">
                      Probable Source Attribution • Step 2
                    </span>
                    <AqiBadge value={284} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        Ward 14 (MP Nagar, Bhopal)
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Ventilation: 920 m²/s (Trap)
                      </span>
                    </div>
                    <SourceBar
                      shares={{ fire: 42, traffic: 22, dust: 18, industry: 10, other: 8 }}
                    />
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">
                      Vulnerability Priority Ranking • Step 3
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Weight: Density + Hospitals
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-[#E03C31]/40 bg-[#E03C31]/10 p-3">
                      <div>
                        <div className="font-bold text-foreground">
                          Rank #1: Ward 09 (Old Bhopal Chowk)
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Density: 24,500/km² • 8 Hospitals • Severe Trap
                        </div>
                      </div>
                      <AqiBadge value={348} size="sm" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/40">
                      <div>
                        <div className="font-bold text-foreground">
                          Rank #2: Ward 04 (Bhanwarkuan, Indore)
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Density: 21,000/km² • 6 Hospitals • Student Cluster
                        </div>
                      </div>
                      <AqiBadge value={292} size="sm" />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00B050]">
                      Targeted Action & Citizen Alert • Step 4
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      SMS Broadcast Ready
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-[#00B050]/30 bg-[#00B050]/10 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#00B050]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Action Dispatched: Anti-Smog Cannon 02</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Routed to arterial hospital corridor in Ward 09.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3.5 bg-muted/40 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Bell className="h-4 w-4 text-[#F28C28]" />
                        <span>Citizen Advisory (हिन्दी)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        "अस्थमा और हृदय रोगी सुबह 9 बजे तक घर के अंदर रहें।"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
