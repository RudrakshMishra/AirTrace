export type UserRole =
  | "state_admin"
  | "city_admin"
  | "officer"
  | "viewer"
  | "moderator";

export interface City {
  id: string;
  name: string;
  name_hi: string;
  bbox: [number, number, number, number];
  center_lat: number;
  center_lon: number;
}

export interface Ward {
  id: string;
  city_id: string;
  name: string;
  name_hi: string;
  geometry_geojson: Record<string, unknown>;
  pop_density: number;
  n_schools: number;
  n_hospitals: number;
}

export interface Station {
  id: string;
  city_id: string;
  name: string;
  lat: number;
  lon: number;
  source: string;
}

export interface Reading {
  id: string;
  station_id: string;
  ts: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface FirePoint {
  id: string;
  lat: number;
  lon: number;
  frp: number;
  confidence: number;
  acq_ts: string;
}

export interface WardState {
  id: string;
  ward_id: string;
  ts: string;
  pm25_est: number;
  aqi_est: number;
  src_fire: number;
  src_traffic: number;
  src_dust: number;
  src_industry: number;
  src_other: number;
  confidence: number;
  ventilation: number;
  trap_flag: boolean;
  risk_score: number;
  evidence_json: Record<string, unknown>;
  model_version: string;
}

export interface RecommendedAction {
  id: string;
  ward_id: string;
  ts: string;
  rule_id: string;
  text_en: string;
  text_hi: string;
  department: string;
  status: "open" | "in_progress" | "done";
  taken_by?: string | null;
  taken_at?: string | null;
  note?: string | null;
}

export interface AlertItem {
  id: string;
  ward_id: string;
  ts: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message_en: string;
  message_hi: string;
  channel: string;
  recipients_count: number;
}

export interface Subscriber {
  id: string;
  clerk_user_id?: string | null;
  phone_hash: string;
  ward_id: string;
  language: "en" | "hi";
  consent_at: string;
}

export interface CitizenReport {
  id: string;
  lat: number;
  lon: number;
  type: string;
  note: string;
  photo_url?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  moderated_by?: string | null;
}

export interface UserRecord {
  id: string;
  clerk_id: string;
  email: string;
  role: UserRole;
  city_id?: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  ts: string;
  actor_clerk_id: string;
  action: string;
  entity: string;
  entity_id: string;
  meta_json: Record<string, unknown>;
}
