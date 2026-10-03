"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CitizenHeader,
  WardSelector,
  SingleScreenAnswer,
  SubscribeDialog,
  CommunityReportDialog,
} from "@/components/citizen";
import { Bell, AlertTriangle } from "lucide-react";
import type { CityDto, WardDto, WardStateDto } from "@/lib/data/schemas";

export function CitizenPortalView({
  cities,
  initialCityId,
  initialWards,
  allWardStates,
}: {
  cities: CityDto[];
  initialCityId: string;
  initialWards: (WardDto & { state?: WardStateDto })[];
  allWardStates: WardStateDto[];
}) {
  const t = useTranslations("citizen");
  const locale = useLocale();

  const [largeText, setLargeText] = React.useState(false);
  const [lowBandwidth, setLowBandwidth] = React.useState(false);

  const [selectedCityId, setSelectedCityId] = React.useState(initialCityId);
  const [currentWards, setCurrentWards] = React.useState(initialWards);
  const [selectedWardId, setSelectedWardId] = React.useState(
    initialWards[0]?.id || "bhopal-w-1"
  );

  const [isSubscribeOpen, setIsSubscribeOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);

  // When city changes, load wards for that city
  const handleCityChange = async (cityId: string) => {
    setSelectedCityId(cityId);
    try {
      const res = await fetch(`/api/wards?cityId=${cityId}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setCurrentWards(json.data);
        setSelectedWardId(json.data[0].id);
      }
    } catch (e) {
      console.warn("Could not fetch wards for city:", e);
    }
  };

  const selectedWard =
    currentWards.find((w) => w.id === selectedWardId) || currentWards[0];

  // Get current state for selected ward
  const currentState = selectedWard?.state || null;

  // Filter 24h timeline for this ward
  const wardTimeline = React.useMemo(() => {
    return allWardStates.filter((ws) => ws.ward_id === selectedWardId).slice(-24);
  }, [allWardStates, selectedWardId]);

  // PWA / Service worker registration
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div
      className={`mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 ${
        largeText ? "text-lg" : ""
      }`}
    >
      {/* 1. Header with Accessibility Toggles */}
      <CitizenHeader
        largeText={largeText}
        setLargeText={setLargeText}
        lowBandwidth={lowBandwidth}
        setLowBandwidth={setLowBandwidth}
      />

      {/* 2. City & Ward Picker with GPS */}
      <WardSelector
        cities={cities}
        wards={currentWards}
        selectedCityId={selectedCityId}
        selectedWardId={selectedWardId}
        onCityChange={handleCityChange}
        onWardChange={setSelectedWardId}
        largeText={largeText}
      />

      {/* 3. Single-Screen Answer */}
      {selectedWard && (
        <SingleScreenAnswer
          ward={selectedWard}
          state={currentState}
          timeline={wardTimeline}
          largeText={largeText}
          lowBandwidth={lowBandwidth}
        />
      )}

      {/* 4. Action Utility Buttons (Subscribe & Report) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => setIsSubscribeOpen(true)}
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0E9AA7]/40 bg-[#0E9AA7]/10 p-4 font-bold text-[#0E9AA7] shadow-xs hover:bg-[#0E9AA7]/20 active:scale-[0.98] transition-all"
        >
          <Bell className="h-5 w-5" />
          <span>{t("subscribeBtn")}</span>
        </button>

        <button
          onClick={() => setIsReportOpen(true)}
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#F28C28]/40 bg-[#F28C28]/10 p-4 font-bold text-[#F28C28] shadow-xs hover:bg-[#F28C28]/20 active:scale-[0.98] transition-all"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>{t("reportBtn")}</span>
        </button>
      </div>

      {/* 5. Modals */}
      <SubscribeDialog
        wardId={selectedWardId}
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        largeText={largeText}
      />

      <CommunityReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        defaultLat={23.2599}
        defaultLon={77.4126}
        largeText={largeText}
      />
    </div>
  );
}
