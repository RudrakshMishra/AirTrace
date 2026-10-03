import { z } from "zod";

export const CitySchema = z.object({
  id: z.string(),
  name: z.string(),
  name_hi: z.string(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  center_lat: z.number(),
  center_lon: z.number(),
});

export const WardSchema = z.object({
  id: z.string(),
  city_id: z.string(),
  name: z.string(),
  name_hi: z.string(),
  geometry_geojson: z.record(z.any()),
  pop_density: z.number(),
  n_schools: z.number(),
  n_hospitals: z.number(),
});

export const StationSchema = z.object({
  id: z.string(),
  city_id: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  source: z.string().default("CPCB"),
});

export const ReadingSchema = z.object({
  id: z.string(),
  station_id: z.string(),
  ts: z.string(),
  pm25: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  no2: z.number().nullable().optional(),
  so2: z.number().nullable().optional(),
  co: z.number().nullable().optional(),
  o3: z.number().nullable().optional(),
});

export const FirePointSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lon: z.number(),
  frp: z.number(),
  confidence: z.number(),
  acq_ts: z.string(),
});

export const WardStateSchema = z.object({
  id: z.string(),
  ward_id: z.string(),
  ts: z.string(),
  pm25_est: z.number(),
  aqi_est: z.number(),
  src_fire: z.number(),
  src_traffic: z.number(),
  src_dust: z.number(),
  src_industry: z.number(),
  src_other: z.number(),
  confidence: z.number(),
  ventilation: z.number(),
  trap_flag: z.boolean(),
  risk_score: z.number(),
  evidence_json: z.record(z.any()).nullable().optional(),
  model_version: z.string().default("v1.0"),
});

export const RecommendedActionSchema = z.object({
  id: z.string(),
  ward_id: z.string(),
  ts: z.string(),
  rule_id: z.string(),
  text_en: z.string(),
  text_hi: z.string(),
  department: z.string(),
  status: z.enum(["open", "in_progress", "done"]),
  taken_by: z.string().nullable().optional(),
  taken_at: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const AlertItemSchema = z.object({
  id: z.string(),
  ward_id: z.string(),
  ts: z.string(),
  type: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message_en: z.string(),
  message_hi: z.string(),
  channel: z.string(),
  recipients_count: z.number(),
});

export const CreateReportSchema = z.object({
  lat: z.number().min(20).max(28),
  lon: z.number().min(74).max(83),
  type: z.enum(["garbage_burning", "construction_dust", "industrial_smoke", "vehicular", "other"]),
  note: z
    .string()
    .min(5)
    .max(1000)
    .transform((val) => val.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim()),
  photo_url: z
    .string()
    .refine(
      (val) =>
        !val ||
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("data:image/"),
      { message: "Must be a valid HTTP(S) URL or image data URI" }
    )
    .nullable()
    .optional(),
});

export const SubscribeSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  ward_id: z.string(),
  language: z.enum(["en", "hi"]).default("hi"),
  clerk_user_id: z.string().nullable().optional(),
});

export type CityDto = z.infer<typeof CitySchema>;
export type WardDto = z.infer<typeof WardSchema>;
export type StationDto = z.infer<typeof StationSchema>;
export type ReadingDto = z.infer<typeof ReadingSchema>;
export type FirePointDto = z.infer<typeof FirePointSchema>;
export type WardStateDto = z.infer<typeof WardStateSchema>;
export type RecommendedActionDto = z.infer<typeof RecommendedActionSchema>;
export type AlertItemDto = z.infer<typeof AlertItemSchema>;
export type CreateReportDto = z.infer<typeof CreateReportSchema>;
export type SubscribeDto = z.infer<typeof SubscribeSchema>;
