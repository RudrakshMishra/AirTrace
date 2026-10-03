import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import seedData from "@/mocks/seed_data.json";
import crypto from "crypto";
import {
  CitySchema,
  WardSchema,
  StationSchema,
  ReadingSchema,
  FirePointSchema,
  WardStateSchema,
  RecommendedActionSchema,
  AlertItemSchema,
  CreateReportSchema,
  SubscribeSchema,
  type CityDto,
  type WardDto,
  type StationDto,
  type ReadingDto,
  type FirePointDto,
  type WardStateDto,
  type RecommendedActionDto,
  type AlertItemDto,
  type CreateReportDto,
  type SubscribeDto,
} from "./schemas";

export * from "./schemas";

const isDbAvailable = Boolean(process.env.DATABASE_URL && db);

// Helper to hash phone numbers server-side for citizen privacy
export function hashPhoneNumber(phone: string): string {
  return crypto.createHash("sha256").update(phone.trim()).digest("hex");
}

/**
 * 1. getCities - Get all supported cities in MP
 */
export async function getCities(): Promise<CityDto[]> {
  if (isDbAvailable && db) {
    try {
      const rows = await db.select().from(schema.cities);
      const mapped = rows.map((r) => ({
        id: r.id,
        name: r.name,
        name_hi: r.name_hi,
        bbox: r.bbox as [number, number, number, number],
        center_lat: Number(r.center_lat),
        center_lon: Number(r.center_lon),
      }));
      return CitySchema.array().parse(mapped);
    } catch (e) {
      console.warn("DB read error in getCities, falling back to mock:", e);
    }
  }

  return CitySchema.array().parse(seedData.cities);
}

/**
 * 2. getWards - Get all wards for a city with their latest state
 */
export async function getWards(
  cityId: string,
  ts?: string
): Promise<(WardDto & { state?: WardStateDto })[]> {
  const wardsList = seedData.wards.filter((w) => w.city_id === cityId);

  const enriched = wardsList.map((w) => {
    // Find matching ward_state
    const states = seedData.ward_state.filter((ws) => ws.ward_id === w.id);
    let matchedState = states[states.length - 1]; // latest by default
    if (ts) {
      const targetTime = new Date(ts).getTime();
      const closest = states.reduce((prev, curr) =>
        Math.abs(new Date(curr.ts).getTime() - targetTime) <
        Math.abs(new Date(prev.ts).getTime() - targetTime)
          ? curr
          : prev
      );
      if (closest) matchedState = closest;
    }

    return {
      ...w,
      geometry_geojson: w.geometry_geojson as Record<string, unknown>,
      state: matchedState
        ? WardStateSchema.parse({
            ...matchedState,
            evidence_json: matchedState.evidence_json as Record<string, unknown>,
          })
        : undefined,
    };
  });

  return enriched;
}

/**
 * 3. getWardDetail - Full detailed view for a single ward
 */
export async function getWardDetail(
  wardId: string,
  ts?: string
): Promise<{
  ward: WardDto;
  state: WardStateDto | null;
  actions: RecommendedActionDto[];
  alerts: AlertItemDto[];
}> {
  const ward = seedData.wards.find((w) => w.id === wardId);
  if (!ward) {
    throw new Error(`Ward with ID ${wardId} not found`);
  }

  const parsedWard = WardSchema.parse({
    ...ward,
    geometry_geojson: ward.geometry_geojson as Record<string, unknown>,
  });

  // States
  const states = seedData.ward_state.filter((ws) => ws.ward_id === wardId);
  let matchedState = states[states.length - 1] || null;
  if (ts && states.length > 0) {
    const targetTime = new Date(ts).getTime();
    matchedState = states.reduce((prev, curr) =>
      Math.abs(new Date(curr.ts).getTime() - targetTime) <
      Math.abs(new Date(prev.ts).getTime() - targetTime)
        ? curr
        : prev
    );
  }

  // Actions & Alerts
  const wardActions = seedData.actions
    .filter((a) => a.ward_id === wardId)
    .map((a) => RecommendedActionSchema.parse(a));

  const wardAlerts = seedData.alerts
    .filter((al) => al.ward_id === wardId)
    .map((al) => AlertItemSchema.parse(al));

  return {
    ward: parsedWard,
    state: matchedState
      ? WardStateSchema.parse({
          ...matchedState,
          evidence_json: matchedState.evidence_json as Record<string, unknown>,
        })
      : null,
    actions: wardActions,
    alerts: wardAlerts,
  };
}

/**
 * 4. getTimeline - Hourly ward states for scrubber/charts (up to 72 hours)
 */
export async function getTimeline(
  wardId: string,
  hours = 24
): Promise<WardStateDto[]> {
  const clampedHours = Math.min(72, Math.max(1, hours));
  const states = seedData.ward_state
    .filter((ws) => ws.ward_id === wardId)
    .slice(-clampedHours);

  return WardStateSchema.array().parse(
    states.map((s) => ({
      ...s,
      evidence_json: s.evidence_json as Record<string, unknown>,
    }))
  );
}

/**
 * 5. getFires - Active thermal anomaly points
 */
export async function getFires(
  cityId?: string,
  hours = 24
): Promise<FirePointDto[]> {
  let firesList = seedData.fires;

  if (cityId) {
    const city = seedData.cities.find((c) => c.id === cityId);
    if (city) {
      // Filter within expanded city bounding box (~100km buffer)
      const buffer = 1.0;
      firesList = firesList.filter(
        (f) =>
          f.lon >= city.bbox[0] - buffer &&
          f.lon <= city.bbox[2] + buffer &&
          f.lat >= city.bbox[1] - buffer &&
          f.lat <= city.bbox[3] + buffer
      );
    }
  }

  return FirePointSchema.array().parse(firesList);
}

/**
 * 6. getStations - CAAQMS monitoring stations with readings
 */
export async function getStations(
  cityId: string
): Promise<(StationDto & { latestReading?: ReadingDto })[]> {
  const stationsList = seedData.stations.filter((s) => s.city_id === cityId);

  return stationsList.map((st) => {
    const stReadings = seedData.readings.filter((r) => r.station_id === st.id);
    const latest = stReadings[stReadings.length - 1];
    return {
      ...StationSchema.parse(st),
      latestReading: latest ? ReadingSchema.parse(latest) : undefined,
    };
  });
}

/**
 * 7. getPriorityWards - Wards ranked by vulnerability and risk score
 */
export async function getPriorityWards(
  cityId: string,
  ts?: string,
  limit = 10
): Promise<(WardDto & { state: WardStateDto })[]> {
  const wards = await getWards(cityId, ts);

  const withState = wards.filter(
    (w): w is WardDto & { state: WardStateDto } => Boolean(w.state)
  );

  // Sort descending by risk score, then by estimated AQI
  withState.sort((a, b) => {
    if (b.state.risk_score !== a.state.risk_score) {
      return b.state.risk_score - a.state.risk_score;
    }
    return b.state.aqi_est - a.state.aqi_est;
  });

  return withState.slice(0, limit);
}

/**
 * 8. getActions - Mitigation actions with optional filters
 */
export async function getActions(
  wardId?: string,
  status?: string
): Promise<RecommendedActionDto[]> {
  let list = seedData.actions;

  if (wardId) {
    list = list.filter((a) => a.ward_id === wardId);
  }
  if (status) {
    list = list.filter((a) => a.status === status);
  }

  return RecommendedActionSchema.array().parse(list);
}

/**
 * 9. getAlerts - Early warning alerts with optional filters
 */
export async function getAlerts(
  wardId?: string,
  severity?: string
): Promise<AlertItemDto[]> {
  let list = seedData.alerts;

  if (wardId) {
    list = list.filter((al) => al.ward_id === wardId);
  }
  if (severity) {
    list = list.filter((al) => al.severity === severity);
  }

  return AlertItemSchema.array().parse(list);
}

// In-memory reports store for runtime additions when DB is not connected
const localReports: any[] = [];

/**
 * 10. createReport - Citizen air quality incident report
 */
export async function createReport(data: CreateReportDto): Promise<{
  id: string;
  status: "pending";
  created_at: string;
}> {
  const validated = CreateReportSchema.parse(data);
  const newReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...validated,
    status: "pending" as const,
    created_at: new Date().toISOString(),
  };

  if (isDbAvailable && db) {
    try {
      await db.insert(schema.reports).values({
        id: newReport.id,
        lat: newReport.lat.toString(),
        lon: newReport.lon.toString(),
        type: newReport.type,
        note: newReport.note,
        photo_url: newReport.photo_url || null,
        status: newReport.status,
        created_at: new Date(newReport.created_at),
      });
    } catch (e) {
      console.warn("Could not insert report into DB, saving locally:", e);
    }
  }

  localReports.push(newReport);

  return {
    id: newReport.id,
    status: newReport.status,
    created_at: newReport.created_at,
  };
}

/**
 * 11. subscribe - Citizen alert subscription with phone hashing
 */
export async function subscribe(data: SubscribeDto): Promise<{
  success: boolean;
  phone_hash: string;
  ward_id: string;
}> {
  const validated = SubscribeSchema.parse(data);
  const phoneHash = hashPhoneNumber(validated.phone);

  const subscriberRecord = {
    id: `sub-${Date.now()}`,
    phone_hash: phoneHash,
    ward_id: validated.ward_id,
    language: validated.language,
    clerk_user_id: validated.clerk_user_id || null,
    consent_at: new Date(),
  };

  if (isDbAvailable && db) {
    try {
      await db.insert(schema.subscribers).values(subscriberRecord);
    } catch (e) {
      console.warn("Could not insert subscriber into DB, processed in-memory:", e);
    }
  }

  return {
    success: true,
    phone_hash: phoneHash,
    ward_id: validated.ward_id,
  };
}
