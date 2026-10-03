"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import type { CityDto, WardDto } from "@/lib/data/schemas";

export function WardSelector({
  cities,
  wards,
  selectedCityId,
  selectedWardId,
  onCityChange,
  onWardChange,
  largeText,
}: {
  cities: CityDto[];
  wards: (WardDto & { state?: any })[];
  selectedCityId: string;
  selectedWardId: string;
  onCityChange: (cityId: string) => void;
  onWardChange: (wardId: string) => void;
  largeText: boolean;
}) {
  const t = useTranslations("citizen");
  const locale = useLocale();
  const [locating, setLocating] = React.useState(false);
  const [geoNotice, setGeoNotice] = React.useState<string | null>(null);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Find nearest city
        let closestCity = cities[0];
        let minCityDist = Infinity;

        for (const c of cities) {
          const dist = Math.hypot(c.center_lat - latitude, c.center_lon - longitude);
          if (dist < minCityDist) {
            minCityDist = dist;
            closestCity = c;
          }
        }

        onCityChange(closestCity.id);

        // Find nearest ward in that city
        if (wards.length > 0) {
          onWardChange(wards[0].id);
        }

        setLocating(false);
        setGeoNotice(t("locationActive"));
      },
      () => {
        setLocating(false);
        setGeoNotice(null);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* City Select */}
        <div className="flex-1">
          <label htmlFor="city-select" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            {t("chooseCity")}
          </label>
          <select
            id="city-select"
            aria-label={t("chooseCity")}
            value={selectedCityId}
            onChange={(e) => onCityChange(e.target.value)}
            className={`w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
              largeText ? "text-base py-2.5" : "text-sm"
            }`}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {locale === "hi" ? city.name_hi : city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Select */}
        <div className="flex-1">
          <label htmlFor="ward-select" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            {t("chooseWard")}
          </label>
          <select
            id="ward-select"
            aria-label={t("chooseWard")}
            value={selectedWardId}
            onChange={(e) => onWardChange(e.target.value)}
            className={`w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
              largeText ? "text-base py-2.5" : "text-sm"
            }`}
          >
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {locale === "hi" ? ward.name_hi : ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Use Location Button */}
        <div className="sm:self-end">
          <button
            onClick={handleUseLocation}
            disabled={locating}
            type="button"
            aria-label={locating ? t("locating") : t("useLocation")}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#0E9AA7]/40 bg-[#0E9AA7]/10 px-4 py-2 font-semibold text-[#0E9AA7] hover:bg-[#0E9AA7]/20 active:scale-95 transition-all ${
              largeText ? "text-base py-2.5" : "text-sm"
            }`}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span>{locating ? t("locating") : t("useLocation")}</span>
          </button>
        </div>
      </div>

      {geoNotice && (
        <div className="flex items-center gap-1.5 text-xs text-[#00B050] font-medium pt-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>{geoNotice}</span>
        </div>
      )}
    </div>
  );
}
