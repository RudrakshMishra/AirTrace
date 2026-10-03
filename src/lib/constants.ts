export const APP_NAME = "AirTrace MP";

export const AQI_BANDS = {
  GOOD: { min: 0, max: 50, label: "Good", label_hi: "अच्छा", color: "#00B050" },
  SATISFACTORY: { min: 51, max: 100, label: "Satisfactory", label_hi: "संतोषजनक", color: "#92D050" },
  MODERATE: { min: 101, max: 200, label: "Moderate", label_hi: "मध्यम", color: "#FFD400" },
  POOR: { min: 201, max: 300, label: "Poor", label_hi: "खराब", color: "#F28C28" },
  VERY_POOR: { min: 301, max: 400, label: "Very Poor", label_hi: "बहुत खराब", color: "#E03C31" },
  SEVERE: { min: 401, max: 500, label: "Severe", label_hi: "गंभीर", color: "#7E0023" },
} as const;

export const POLLUTION_SOURCES = {
  fire: { key: "src_fire", label: "Fires / Biomass", label_hi: "आग / बायोमास", color: "#D55E00" },
  traffic: { key: "src_traffic", label: "Vehicular Traffic", label_hi: "यातायात", color: "#0072B2" },
  dust: { key: "src_dust", label: "Road & Construction Dust", label_hi: "धूल", color: "#E69F00" },
  industry: { key: "src_industry", label: "Industrial Emissions", label_hi: "उद्योग", color: "#6A3D9A" },
  other: { key: "src_other", label: "Other / Background", label_hi: "अन्य", color: "#7F7F7F" },
} as const;

export const USER_ROLES = [
  "state_admin",
  "city_admin",
  "officer",
  "viewer",
  "moderator",
] as const;

export const DEFAULT_CITIES = [
  { id: "bhopal", name: "Bhopal", name_hi: "भोपाल", lat: 23.2599, lon: 77.4126 },
  { id: "indore", name: "Indore", name_hi: "इंदौर", lat: 22.7196, lon: 75.8577 },
  { id: "singrauli", name: "Singrauli", name_hi: "सिंगरौली", lat: 24.1997, lon: 82.6645 },
] as const;

export const LEGAL_DISCLAIMER =
  "Indicative screening, not legal source apportionment.";
