import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  name_hi: text("name_hi").notNull(),
  bbox: jsonb("bbox").notNull(),
  center_lat: numeric("center_lat").notNull(),
  center_lon: numeric("center_lon").notNull(),
});

export const wards = pgTable(
  "wards",
  {
    id: text("id").primaryKey(),
    city_id: text("city_id")
      .notNull()
      .references(() => cities.id),
    name: text("name").notNull(),
    name_hi: text("name_hi").notNull(),
    geometry_geojson: jsonb("geometry_geojson").notNull(),
    pop_density: integer("pop_density").notNull().default(0),
    n_schools: integer("n_schools").notNull().default(0),
    n_hospitals: integer("n_hospitals").notNull().default(0),
  },
  (table) => [index("wards_city_id_idx").on(table.city_id)]
);

export const stations = pgTable(
  "stations",
  {
    id: text("id").primaryKey(),
    city_id: text("city_id")
      .notNull()
      .references(() => cities.id),
    name: text("name").notNull(),
    lat: numeric("lat").notNull(),
    lon: numeric("lon").notNull(),
    source: text("source").notNull().default("CPCB"),
  },
  (table) => [index("stations_city_id_idx").on(table.city_id)]
);

export const readings = pgTable(
  "readings",
  {
    id: text("id").primaryKey(),
    station_id: text("station_id")
      .notNull()
      .references(() => stations.id),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    pm25: numeric("pm25"),
    pm10: numeric("pm10"),
    no2: numeric("no2"),
    so2: numeric("so2"),
    co: numeric("co"),
    o3: numeric("o3"),
  },
  (table) => [index("readings_station_ts_idx").on(table.station_id, table.ts)]
);

export const fires = pgTable(
  "fires",
  {
    id: text("id").primaryKey(),
    lat: numeric("lat").notNull(),
    lon: numeric("lon").notNull(),
    frp: numeric("frp").notNull(),
    confidence: integer("confidence").notNull(),
    acq_ts: timestamp("acq_ts", { withTimezone: true }).notNull(),
  },
  (table) => [index("fires_acq_ts_idx").on(table.acq_ts)]
);

export const ward_state = pgTable(
  "ward_state",
  {
    id: text("id").primaryKey(),
    ward_id: text("ward_id")
      .notNull()
      .references(() => wards.id),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    pm25_est: numeric("pm25_est").notNull(),
    aqi_est: integer("aqi_est").notNull(),
    src_fire: integer("src_fire").notNull().default(0),
    src_traffic: integer("src_traffic").notNull().default(0),
    src_dust: integer("src_dust").notNull().default(0),
    src_industry: integer("src_industry").notNull().default(0),
    src_other: integer("src_other").notNull().default(0),
    confidence: integer("confidence").notNull().default(0),
    ventilation: numeric("ventilation").notNull().default("0"),
    trap_flag: boolean("trap_flag").notNull().default(false),
    risk_score: numeric("risk_score").notNull().default("0"),
    evidence_json: jsonb("evidence_json"),
    model_version: text("model_version").notNull().default("v1.0"),
  },
  (table) => [index("ward_state_ward_ts_idx").on(table.ward_id, table.ts)]
);

export const actions = pgTable(
  "actions",
  {
    id: text("id").primaryKey(),
    ward_id: text("ward_id")
      .notNull()
      .references(() => wards.id),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    rule_id: text("rule_id").notNull(),
    text_en: text("text_en").notNull(),
    text_hi: text("text_hi").notNull(),
    department: text("department").notNull(),
    status: text("status").notNull().default("open"),
    taken_by: text("taken_by"),
    taken_at: timestamp("taken_at", { withTimezone: true }),
    note: text("note"),
  },
  (table) => [index("actions_ward_ts_idx").on(table.ward_id, table.ts)]
);

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    ward_id: text("ward_id")
      .notNull()
      .references(() => wards.id),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    type: text("type").notNull(),
    severity: text("severity").notNull(),
    message_en: text("message_en").notNull(),
    message_hi: text("message_hi").notNull(),
    channel: text("channel").notNull(),
    recipients_count: integer("recipients_count").notNull().default(0),
  },
  (table) => [index("alerts_ward_ts_idx").on(table.ward_id, table.ts)]
);

export const subscribers = pgTable(
  "subscribers",
  {
    id: text("id").primaryKey(),
    clerk_user_id: text("clerk_user_id"),
    phone_hash: text("phone_hash").notNull(),
    ward_id: text("ward_id")
      .notNull()
      .references(() => wards.id),
    language: text("language").notNull().default("hi"),
    consent_at: timestamp("consent_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("subscribers_ward_id_idx").on(table.ward_id)]
);

export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    lat: numeric("lat").notNull(),
    lon: numeric("lon").notNull(),
    type: text("type").notNull(),
    note: text("note").notNull(),
    photo_url: text("photo_url"),
    status: text("status").notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
    moderated_by: text("moderated_by"),
  },
  (table) => [index("reports_status_idx").on(table.status)]
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerk_id: text("clerk_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("viewer"),
    city_id: text("city_id"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("users_clerk_id_idx").on(table.clerk_id)]
);

export const audit_log = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    actor_clerk_id: text("actor_clerk_id").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entity_id: text("entity_id").notNull(),
    meta_json: jsonb("meta_json"),
  },
  (table) => [index("audit_log_ts_idx").on(table.ts)]
);
