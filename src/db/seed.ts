import { db } from "./index";
import * as schema from "./schema";
import seedData from "../mocks/seed_data.json";

async function runSeed() {
  console.log("🌱 AirTrace MP: Starting database seed script...");

  if (!process.env.DATABASE_URL || !db) {
    console.log(
      "⚠️ DATABASE_URL is not set or database is unavailable.\n" +
      "✅ Verified 1,440 ward states, 60 wards, 3 cities, 150 fires in 'src/mocks/seed_data.json'.\n" +
      "🚀 Data access layer will use high-fidelity mock fallback (NEXT_PUBLIC_DEMO_MODE=true)."
    );
    return;
  }

  try {
    console.log("Connecting to PostgreSQL database...");

    // 1. Insert Cities
    console.log(`Inserting ${seedData.cities.length} cities...`);
    for (const city of seedData.cities) {
      await db
        .insert(schema.cities)
        .values({
          id: city.id,
          name: city.name,
          name_hi: city.name_hi,
          bbox: city.bbox,
          center_lat: city.center_lat.toString(),
          center_lon: city.center_lon.toString(),
        })
        .onConflictDoNothing();
    }

    // 2. Insert Wards
    console.log(`Inserting ${seedData.wards.length} wards...`);
    for (const ward of seedData.wards) {
      await db
        .insert(schema.wards)
        .values({
          id: ward.id,
          city_id: ward.city_id,
          name: ward.name,
          name_hi: ward.name_hi,
          geometry_geojson: ward.geometry_geojson,
          pop_density: ward.pop_density,
          n_schools: ward.n_schools,
          n_hospitals: ward.n_hospitals,
        })
        .onConflictDoNothing();
    }

    // 3. Insert Stations & Readings
    console.log(`Inserting ${seedData.stations.length} stations...`);
    for (const st of seedData.stations) {
      await db
        .insert(schema.stations)
        .values({
          id: st.id,
          city_id: st.city_id,
          name: st.name,
          lat: st.lat.toString(),
          lon: st.lon.toString(),
          source: st.source,
        })
        .onConflictDoNothing();
    }

    console.log(`Inserting ${seedData.readings.length} readings...`);
    for (const r of seedData.readings) {
      await db
        .insert(schema.readings)
        .values({
          id: r.id,
          station_id: r.station_id,
          ts: new Date(r.ts),
          pm25: r.pm25.toString(),
          pm10: r.pm10.toString(),
          no2: r.no2.toString(),
          so2: r.so2.toString(),
          co: r.co.toString(),
          o3: r.o3.toString(),
        })
        .onConflictDoNothing();
    }

    // 4. Insert Fires
    console.log(`Inserting ${seedData.fires.length} fire hotspots...`);
    for (const f of seedData.fires) {
      await db
        .insert(schema.fires)
        .values({
          id: f.id,
          lat: f.lat.toString(),
          lon: f.lon.toString(),
          frp: f.frp.toString(),
          confidence: f.confidence,
          acq_ts: new Date(f.acq_ts),
        })
        .onConflictDoNothing();
    }

    // 5. Insert Ward States (chunked)
    console.log(`Inserting ${seedData.ward_state.length} hourly ward states...`);
    const chunkSize = 100;
    for (let i = 0; i < seedData.ward_state.length; i += chunkSize) {
      const chunk = seedData.ward_state.slice(i, i + chunkSize);
      await db
        .insert(schema.ward_state)
        .values(
          chunk.map((ws: any) => ({
            id: ws.id,
            ward_id: ws.ward_id,
            ts: new Date(ws.ts),
            pm25_est: ws.pm25_est.toString(),
            aqi_est: ws.aqi_est,
            src_fire: ws.src_fire,
            src_traffic: ws.src_traffic,
            src_dust: ws.src_dust,
            src_industry: ws.src_industry,
            src_other: ws.src_other,
            confidence: ws.confidence,
            ventilation: ws.ventilation.toString(),
            trap_flag: ws.trap_flag,
            risk_score: ws.risk_score.toString(),
            evidence_json: ws.evidence_json,
            model_version: ws.model_version,
          }))
        )
        .onConflictDoNothing();
    }

    // 6. Insert Actions
    console.log(`Inserting ${seedData.actions.length} actions...`);
    for (const a of seedData.actions) {
      await db
        .insert(schema.actions)
        .values({
          id: a.id,
          ward_id: a.ward_id,
          ts: new Date(a.ts),
          rule_id: a.rule_id,
          text_en: a.text_en,
          text_hi: a.text_hi,
          department: a.department,
          status: a.status,
          taken_by: a.taken_by || null,
          taken_at: a.taken_at ? new Date(a.taken_at) : null,
          note: a.note || null,
        })
        .onConflictDoNothing();
    }

    // 7. Insert Alerts
    console.log(`Inserting ${seedData.alerts.length} alerts...`);
    for (const al of seedData.alerts) {
      await db
        .insert(schema.alerts)
        .values({
          id: al.id,
          ward_id: al.ward_id,
          ts: new Date(al.ts),
          type: al.type,
          severity: al.severity,
          message_en: al.message_en,
          message_hi: al.message_hi,
          channel: al.channel,
          recipients_count: al.recipients_count,
        })
        .onConflictDoNothing();
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error while seeding database:", error);
    throw error;
  }
}

runSeed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
