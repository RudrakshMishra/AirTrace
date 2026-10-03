CREATE TABLE "actions" (
	"id" text PRIMARY KEY NOT NULL,
	"ward_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"rule_id" text NOT NULL,
	"text_en" text NOT NULL,
	"text_hi" text NOT NULL,
	"department" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"taken_by" text,
	"taken_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"ward_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"message_en" text NOT NULL,
	"message_hi" text NOT NULL,
	"channel" text NOT NULL,
	"recipients_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"actor_clerk_id" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"meta_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_hi" text NOT NULL,
	"bbox" jsonb NOT NULL,
	"center_lat" numeric NOT NULL,
	"center_lon" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fires" (
	"id" text PRIMARY KEY NOT NULL,
	"lat" numeric NOT NULL,
	"lon" numeric NOT NULL,
	"frp" numeric NOT NULL,
	"confidence" integer NOT NULL,
	"acq_ts" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" text PRIMARY KEY NOT NULL,
	"station_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"pm25" numeric,
	"pm10" numeric,
	"no2" numeric,
	"so2" numeric,
	"co" numeric,
	"o3" numeric
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"lat" numeric NOT NULL,
	"lon" numeric NOT NULL,
	"type" text NOT NULL,
	"note" text NOT NULL,
	"photo_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"moderated_by" text
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"lat" numeric NOT NULL,
	"lon" numeric NOT NULL,
	"source" text DEFAULT 'CPCB' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"phone_hash" text NOT NULL,
	"ward_id" text NOT NULL,
	"language" text DEFAULT 'hi' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"city_id" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ward_state" (
	"id" text PRIMARY KEY NOT NULL,
	"ward_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"pm25_est" numeric NOT NULL,
	"aqi_est" integer NOT NULL,
	"src_fire" integer DEFAULT 0 NOT NULL,
	"src_traffic" integer DEFAULT 0 NOT NULL,
	"src_dust" integer DEFAULT 0 NOT NULL,
	"src_industry" integer DEFAULT 0 NOT NULL,
	"src_other" integer DEFAULT 0 NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"ventilation" numeric DEFAULT '0' NOT NULL,
	"trap_flag" boolean DEFAULT false NOT NULL,
	"risk_score" numeric DEFAULT '0' NOT NULL,
	"evidence_json" jsonb,
	"model_version" text DEFAULT 'v1.0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"name_hi" text NOT NULL,
	"geometry_geojson" jsonb NOT NULL,
	"pop_density" integer DEFAULT 0 NOT NULL,
	"n_schools" integer DEFAULT 0 NOT NULL,
	"n_hospitals" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ward_state" ADD CONSTRAINT "ward_state_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_ward_ts_idx" ON "actions" USING btree ("ward_id","ts");--> statement-breakpoint
CREATE INDEX "alerts_ward_ts_idx" ON "alerts" USING btree ("ward_id","ts");--> statement-breakpoint
CREATE INDEX "audit_log_ts_idx" ON "audit_log" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "fires_acq_ts_idx" ON "fires" USING btree ("acq_ts");--> statement-breakpoint
CREATE INDEX "readings_station_ts_idx" ON "readings" USING btree ("station_id","ts");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stations_city_id_idx" ON "stations" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "subscribers_ward_id_idx" ON "subscribers" USING btree ("ward_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "ward_state_ward_ts_idx" ON "ward_state" USING btree ("ward_id","ts");--> statement-breakpoint
CREATE INDEX "wards_city_id_idx" ON "wards" USING btree ("city_id");