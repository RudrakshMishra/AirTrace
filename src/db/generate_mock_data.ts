import * as fs from "fs";
import * as path from "path";

const CITIES = [
  {
    id: "bhopal",
    name: "Bhopal",
    name_hi: "भोपाल",
    bbox: [77.28, 23.15, 77.52, 23.35] as [number, number, number, number],
    center_lat: 23.2599,
    center_lon: 77.4126,
    wards: [
      { name: "MP Nagar Zone 1", name_hi: "एमपी नगर ज़ोन 1", offset: [0.01, 0.01], density: 14200, schools: 8, hospitals: 5 },
      { name: "MP Nagar Zone 2", name_hi: "एमपी नगर ज़ोन 2", offset: [0.02, 0.01], density: 15600, schools: 6, hospitals: 4 },
      { name: "Arera Colony E-1", name_hi: "अरेरा कॉलोनी ई-1", offset: [-0.01, -0.02], density: 9800, schools: 12, hospitals: 6 },
      { name: "Arera Colony E-3", name_hi: "अरेरा कॉलोनी ई-3", offset: [-0.02, -0.03], density: 8900, schools: 10, hospitals: 4 },
      { name: "Kolar Road North", name_hi: "कोलार रोड उत्तर", offset: [-0.02, -0.06], density: 11200, schools: 9, hospitals: 3 },
      { name: "Kolar Road South", name_hi: "कोलार रोड दक्षिण", offset: [-0.03, -0.08], density: 8500, schools: 7, hospitals: 2 },
      { name: "TT Nagar", name_hi: "टीटी नगर", offset: [-0.01, 0.00], density: 16800, schools: 14, hospitals: 7 },
      { name: "Govindpura Industrial", name_hi: "गोविंदपुरा औद्योगिक क्षेत्र", offset: [0.04, 0.02], density: 7500, schools: 5, hospitals: 2 },
      { name: "Karond Mandi", name_hi: "करौंद मंडी", offset: [0.01, 0.08], density: 18400, schools: 8, hospitals: 3 },
      { name: "Bairagarh (Sant Hirdaram)", name_hi: "बैरागढ़ (संत हिरदाराम नगर)", offset: [-0.09, 0.04], density: 13500, schools: 11, hospitals: 5 },
      { name: "Shahpura Lake View", name_hi: "शाहपुरा लेक व्यू", offset: [-0.01, -0.04], density: 10400, schools: 7, hospitals: 4 },
      { name: "Habibganj", name_hi: "हबीबगंज", offset: [0.02, -0.01], density: 14700, schools: 9, hospitals: 4 },
      { name: "Old Bhopal Chowk", name_hi: "पुराना भोपाल चौक", offset: [-0.03, 0.04], density: 24500, schools: 15, hospitals: 8 },
      { name: "Jahangirabad", name_hi: "जहाँगीराबाद", offset: [-0.02, 0.02], density: 22100, schools: 12, hospitals: 5 },
      { name: "Ayodhya Bypass", name_hi: "अयोध्या बायपास", offset: [0.06, 0.05], density: 9200, schools: 6, hospitals: 2 },
      { name: "Misrod", name_hi: "मिसरोद", offset: [0.04, -0.08], density: 8900, schools: 7, hospitals: 3 },
      { name: "BHEL Township Sector A", name_hi: "भेल टाउनशिप सेक्टर ए", offset: [0.05, 0.01], density: 6400, schools: 10, hospitals: 3 },
      { name: "BHEL Township Sector B", name_hi: "भेल टाउनशिप सेक्टर बी", offset: [0.06, 0.00], density: 5900, schools: 8, hospitals: 2 },
      { name: "Huzur Rural Fringe", name_hi: "हुजूर ग्रामीण सीमा", offset: [-0.07, -0.05], density: 4200, schools: 4, hospitals: 1 },
      { name: "Gandhinagar Airport Area", name_hi: "गांधीनगर एयरपोर्ट क्षेत्र", offset: [-0.06, 0.07], density: 5100, schools: 5, hospitals: 2 },
    ],
  },
  {
    id: "indore",
    name: "Indore",
    name_hi: "इंदौर",
    bbox: [75.76, 22.62, 75.95, 22.82] as [number, number, number, number],
    center_lat: 22.7196,
    center_lon: 75.8577,
    wards: [
      { name: "Vijay Nagar", name_hi: "विजय नगर", offset: [0.03, 0.04], density: 17500, schools: 16, hospitals: 9 },
      { name: "New Palasia", name_hi: "न्यू पलासिया", offset: [0.02, 0.01], density: 16200, schools: 11, hospitals: 7 },
      { name: "Old Palasia", name_hi: "ओल्ड पलासिया", offset: [0.02, 0.00], density: 15400, schools: 9, hospitals: 5 },
      { name: "Rajwada City Center", name_hi: "राजवाड़ा सिटी सेंटर", offset: [-0.01, 0.00], density: 28900, schools: 14, hospitals: 8 },
      { name: "Bhanwarkuan", name_hi: "भंवरकुआं", offset: [-0.01, -0.03], density: 21000, schools: 18, hospitals: 6 },
      { name: "Rau Bypass", name_hi: "राऊ बायपास", offset: [-0.02, -0.07], density: 8400, schools: 6, hospitals: 3 },
      { name: "Annapurna", name_hi: "अन्नपूर्णा", offset: [-0.03, -0.02], density: 18200, schools: 12, hospitals: 4 },
      { name: "Sanwer Road Industrial", name_hi: "सांवेर रोड औद्योगिक क्षेत्र", offset: [0.01, 0.07], density: 6200, schools: 4, hospitals: 2 },
      { name: "Pologround", name_hi: "पोलो ग्राउंड", offset: [-0.01, 0.03], density: 14100, schools: 7, hospitals: 3 },
      { name: "Khajrana", name_hi: "खजराना", offset: [0.05, 0.02], density: 22400, schools: 13, hospitals: 5 },
      { name: "Bicholi Mardana", name_hi: "बिचौली मर्दाना", offset: [0.06, -0.01], density: 7900, schools: 5, hospitals: 2 },
      { name: "Nipania", name_hi: "निपानिया", offset: [0.05, 0.06], density: 9800, schools: 8, hospitals: 4 },
      { name: "Sudama Nagar", name_hi: "सुदामा नगर", offset: [-0.04, -0.01], density: 19800, schools: 11, hospitals: 4 },
      { name: "Rajendra Nagar", name_hi: "राजेंद्र नगर", offset: [-0.03, -0.05], density: 12400, schools: 7, hospitals: 3 },
      { name: "Bada Ganpati", name_hi: "बड़ा गणपति", offset: [-0.02, 0.01], density: 23100, schools: 10, hospitals: 5 },
      { name: "Aerodrome Road", name_hi: "एरोड्रॉम रोड", offset: [-0.05, 0.02], density: 13900, schools: 8, hospitals: 3 },
      { name: "Chandan Nagar", name_hi: "चंदन नगर", offset: [-0.04, 0.00], density: 21500, schools: 9, hospitals: 4 },
      { name: "Dewas Naka", name_hi: "देवास नाका", offset: [0.04, 0.08], density: 9100, schools: 6, hospitals: 2 },
      { name: "LIG Colony", name_hi: "एलआईजी कॉलोनी", offset: [0.03, 0.02], density: 16700, schools: 10, hospitals: 4 },
      { name: "Geeta Bhawan", name_hi: "गीता भवन", offset: [0.01, -0.01], density: 17800, schools: 12, hospitals: 8 },
    ],
  },
  {
    id: "singrauli",
    name: "Singrauli",
    name_hi: "सिंगरौली",
    bbox: [82.50, 24.05, 82.80, 24.30] as [number, number, number, number],
    center_lat: 24.1997,
    center_lon: 82.6645,
    wards: [
      { name: "Waidhan Central", name_hi: "बैढ़न सेंट्रल", offset: [0.00, 0.00], density: 11200, schools: 9, hospitals: 6 },
      { name: "Waidhan Industrial Area", name_hi: "बैढ़न औद्योगिक क्षेत्र", offset: [0.02, 0.01], density: 6800, schools: 4, hospitals: 2 },
      { name: "Vindhyanagar Sector 1", name_hi: "विंध्यनगर सेक्टर 1", offset: [0.05, -0.02], density: 8400, schools: 8, hospitals: 4 },
      { name: "Vindhyanagar Thermal Plant", name_hi: "विंध्यनगर थर्मल पावर", offset: [0.07, -0.03], density: 4200, schools: 3, hospitals: 2 },
      { name: "Morwa East", name_hi: "मोरवा पूर्व", offset: [0.02, 0.06], density: 13500, schools: 7, hospitals: 3 },
      { name: "Morwa Colliery", name_hi: "मोरवा कोलियरी", offset: [0.03, 0.08], density: 7100, schools: 5, hospitals: 2 },
      { name: "Jayant Open Cast Mine", name_hi: "जयंत खुली कोयला खदान", offset: [0.06, 0.02], density: 5100, schools: 4, hospitals: 2 },
      { name: "Nigahi Mine Area", name_hi: "निगाही खदान क्षेत्र", offset: [0.08, 0.05], density: 4800, schools: 4, hospitals: 2 },
      { name: "Jhingurdah", name_hi: "झिंगुरदाह", offset: [-0.02, 0.07], density: 6400, schools: 5, hospitals: 2 },
      { name: "Gadhwa Road", name_hi: "गढ़वा रोड", offset: [-0.03, -0.02], density: 7800, schools: 6, hospitals: 3 },
      { name: "Bargawan", name_hi: "बरगवां", offset: [-0.06, 0.04], density: 6200, schools: 5, hospitals: 2 },
      { name: "Deosar Fringe", name_hi: "देवसर सीमा", offset: [-0.08, -0.05], density: 3900, schools: 3, hospitals: 1 },
      { name: "Gorbi Block", name_hi: "गोरबी ब्लॉक", offset: [0.01, 0.09], density: 5600, schools: 4, hospitals: 2 },
      { name: "Khanna Banjari", name_hi: "खन्ना बंजारी", offset: [-0.04, 0.02], density: 7100, schools: 5, hospitals: 2 },
      { name: "Mada Caves Heritage Zone", name_hi: "माड़ा गुफा हेरिटेज ज़ोन", offset: [-0.09, -0.08], density: 2800, schools: 2, hospitals: 1 },
      { name: "Shaktinagar MP Border", name_hi: "शक्तिनगर म.प्र. सीमा", offset: [0.09, -0.05], density: 9200, schools: 7, hospitals: 4 },
      { name: "Anpara Transition Area", name_hi: "अनपरा ट्रांजिशन क्षेत्र", offset: [0.10, -0.06], density: 6500, schools: 5, hospitals: 2 },
      { name: "Rihand Reservoir Bank", name_hi: "रिहंद जलाशय तट", offset: [0.08, -0.08], density: 3200, schools: 3, hospitals: 1 },
      { name: "Navjeevan Vihar", name_hi: "नवजीवन विहार", offset: [0.04, -0.01], density: 10400, schools: 8, hospitals: 3 },
      { name: "NTPC Colony", name_hi: "एनटीपीसी कॉलोनी", offset: [0.06, -0.04], density: 8700, schools: 7, hospitals: 4 },
    ],
  },
];

function generateGeoJsonPolygon(centerLon: number, centerLat: number, radius = 0.012) {
  const points: [number, number][] = [];
  const sides = 6;
  for (let i = 0; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const dx = radius * Math.cos(angle) * 1.1;
    const dy = radius * Math.sin(angle) * 0.9;
    points.push([Number((centerLon + dx).toFixed(5)), Number((centerLat + dy).toFixed(5))]);
  }
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [points],
    },
    properties: {},
  };
}

export function generateAllMockData() {
  const citiesData: any[] = [];
  const wardsData: any[] = [];
  const stationsData: any[] = [];
  const readingsData: any[] = [];
  const firesData: any[] = [];
  const wardStateData: any[] = [];
  const actionsData: any[] = [];
  const alertsData: any[] = [];

  const now = new Date();

  // 1. Process Cities & Wards
  for (const c of CITIES) {
    citiesData.push({
      id: c.id,
      name: c.name,
      name_hi: c.name_hi,
      bbox: c.bbox,
      center_lat: c.center_lat,
      center_lon: c.center_lon,
    });

    // 2-3 Monitoring Stations per city
    const stations = [
      { id: `${c.id}-st-1`, name: `${c.name} Central CAAQMS`, lat: c.center_lat + 0.005, lon: c.center_lon + 0.004 },
      { id: `${c.id}-st-2`, name: `${c.name} Industrial CAAQMS`, lat: c.center_lat + 0.025, lon: c.center_lon + 0.022 },
      { id: `${c.id}-st-3`, name: `${c.name} Residential Sub-station`, lat: c.center_lat - 0.02, lon: c.center_lon - 0.015 },
    ];

    for (const st of stations) {
      stationsData.push({
        id: st.id,
        city_id: c.id,
        name: st.name,
        lat: Number(st.lat.toFixed(4)),
        lon: Number(st.lon.toFixed(4)),
        source: "MPPCB / CPCB",
      });

      // 24 hours of readings
      for (let h = 23; h >= 0; h--) {
        const ts = new Date(now.getTime() - h * 3600 * 1000).toISOString();
        const basePm25 = c.id === "singrauli" ? 140 : c.id === "indore" ? 95 : 110;
        const diurnalFactor = (h >= 4 && h <= 9) ? 1.4 : (h >= 13 && h <= 17) ? 0.75 : 1.1;
        const pm25 = Math.round(basePm25 * diurnalFactor + (Math.sin(h) * 15));
        readingsData.push({
          id: `${st.id}-r-${h}`,
          station_id: st.id,
          ts,
          pm25,
          pm10: Math.round(pm25 * 1.7),
          no2: Math.round(35 + Math.cos(h) * 12),
          so2: c.id === "singrauli" ? Math.round(45 + Math.sin(h) * 15) : Math.round(18 + Math.sin(h) * 5),
          co: Number((1.2 + Math.sin(h) * 0.4).toFixed(1)),
          o3: Math.round(28 + Math.cos(h) * 10),
        });
      }
    }

    // Wards and 24h ward_state
    for (let i = 0; i < c.wards.length; i++) {
      const w = c.wards[i];
      const wardId = `${c.id}-w-${i + 1}`;
      const lat = c.center_lat + w.offset[1];
      const lon = c.center_lon + w.offset[0];

      wardsData.push({
        id: wardId,
        city_id: c.id,
        name: w.name,
        name_hi: w.name_hi,
        geometry_geojson: generateGeoJsonPolygon(lon, lat),
        pop_density: w.density,
        n_schools: w.schools,
        n_hospitals: w.hospitals,
      });

      // City-specific source attribution bias
      const isSingrauli = c.id === "singrauli";
      const isIndore = c.id === "indore";
      const baseFire = isSingrauli ? 18 : isIndore ? 26 : 38;
      const baseTraffic = isIndore ? 34 : isSingrauli ? 15 : 24;
      const baseDust = isIndore ? 22 : 18;
      const baseIndustry = isSingrauli ? 35 : isIndore ? 10 : 12;
      const baseOther = 8;

      // Generate 24 hours of ward_state
      for (let h = 23; h >= 0; h--) {
        const ts = new Date(now.getTime() - h * 3600 * 1000).toISOString();
        const hourOfDay = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60) - h + 24) % 24;

        // Morning atmospheric inversion trap condition between 5 AM and 9 AM
        const isMorningTrapHour = hourOfDay >= 5 && hourOfDay <= 9;
        const isTrapWard = isMorningTrapHour && (i % 3 === 0);
        const ventilationCoeff = isMorningTrapHour ? 850 : 2600 + (Math.sin(h) * 800);

        const pm25Est = isTrapWard
          ? Math.round(160 + (i * 4) + (Math.sin(h) * 15))
          : Math.round(85 + (i * 3) + (Math.cos(h) * 12));

        const aqiEst = Math.min(500, Math.round(pm25Est * 1.55));
        const vulnerabilityWeight = (w.density / 10000) * 0.4 + (w.schools * 0.03) + (w.hospitals * 0.05);
        const riskScore = Number(((aqiEst / 500) * 0.6 + Math.min(0.4, vulnerabilityWeight)).toFixed(3));

        wardStateData.push({
          id: `${wardId}-ws-${h}`,
          ward_id: wardId,
          ts,
          pm25_est: pm25Est,
          aqi_est: aqiEst,
          src_fire: baseFire + (i % 5),
          src_traffic: baseTraffic + (i % 4),
          src_dust: baseDust,
          src_industry: baseIndustry,
          src_other: baseOther,
          confidence: 75 + (i % 15),
          ventilation: Math.round(ventilationCoeff),
          trap_flag: isTrapWard,
          risk_score: riskScore,
          evidence_json: {
            satellite_thermal_anomaly: baseFire > 25,
            wind_direction_deg: 245,
            wind_speed_kmh: 8.4,
            inversion_layer_height_m: isTrapWard ? 180 : 750,
            nearest_hotspot_dist_km: 14.2,
          },
          model_version: "v1.2-mp-screen",
        });
      }
    }

    // Sample Actions for this city
    actionsData.push(
      {
        id: `act-${c.id}-1`,
        ward_id: `${c.id}-w-1`,
        ts: now.toISOString(),
        rule_id: "RULE_SMOG_GUN_01",
        text_en: "Deploy 2 mobile anti-smog water cannons along arterial junctions.",
        text_hi: "मुख्य चौराहों पर 2 मोबाइल एंटी-स्मॉग वाटर तोपें तैनात करें।",
        department: "Municipal Corporation",
        status: "open",
        note: "Targeted due to elevated construction dust and high hospital density.",
      },
      {
        id: `act-${c.id}-2`,
        ward_id: `${c.id}-w-2`,
        ts: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        rule_id: "RULE_SWEEP_04",
        text_en: "Mechanised night vacuum sweeping scheduled across transit corridors.",
        text_hi: "परिवहन गलियारों में रात्रि यंत्रीकृत वैक्यूम सफाई निर्धारित।",
        department: "Urban Development",
        status: "in_progress",
        taken_by: "Zone Officer Verma",
        taken_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
        note: "3 sweeping trucks active.",
      },
      {
        id: `act-${c.id}-3`,
        ward_id: `${c.id}-w-3`,
        ts: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
        rule_id: "RULE_FIRE_INTERCEPT_02",
        text_en: "Flying squad dispatched for open biomass waste incineration inspection.",
        text_hi: "खुले में कचरा/बायोमास जलाने की रोकथाम हेतु उड़नदस्ता निरीक्षण।",
        department: "MPPCB Enforcement",
        status: "done",
        taken_by: "Inspector Sharma",
        taken_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
        note: "2 illegal open dump fires doused and spot fines levied.",
      }
    );

    // Sample Alerts
    alertsData.push(
      {
        id: `alt-${c.id}-1`,
        ward_id: `${c.id}-w-1`,
        ts: now.toISOString(),
        type: "POLLUTION_TRAP",
        severity: "high",
        message_en: "Atmospheric inversion trap detected. Ventilation coefficient < 1000 m²/s. Particulate dispersion critically suppressed.",
        message_hi: "वायुमंडलीय इनवर्जन ट्रैप दर्ज। वेंटिलेशन गुणांक < 1000 m²/s। कणों का फैलाव अत्यधिक अवरुद्ध।",
        channel: "DASHBOARD_SMS",
        recipients_count: 1420,
      },
      {
        id: `alt-${c.id}-2`,
        ward_id: `${c.id}-w-7`,
        ts: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
        type: "AQI_SEVERE_SPIKE",
        severity: "critical",
        message_en: "AQI crossed 350 (Very Poor) threshold. School outdoor activities restricted.",
        message_hi: "AQI 350 (बहुत खराब) सीमा पार कर गया। स्कूलों में बाहरी गतिविधियां प्रतिबंधित।",
        channel: "CITIZEN_BROADCAST",
        recipients_count: 5800,
      }
    );
  }

  // 150 Fire Points across MP (lat: 21.5 to 26.5, lon: 74.5 to 82.5)
  for (let f = 1; f <= 150; f++) {
    const lat = Number((21.8 + (Math.sin(f * 3.7) * 2.2) + 2.0).toFixed(4));
    const lon = Number((74.8 + (Math.cos(f * 2.3) * 3.5) + 3.5).toFixed(4));
    const frp = Number((12 + (f % 45) * 2.8).toFixed(1));
    const hoursAgo = f % 24;
    firesData.push({
      id: `fire-mp-${f}`,
      lat,
      lon,
      frp,
      confidence: 65 + (f % 35),
      acq_ts: new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString(),
    });
  }

  return {
    cities: citiesData,
    wards: wardsData,
    stations: stationsData,
    readings: readingsData,
    fires: firesData,
    ward_state: wardStateData,
    actions: actionsData,
    alerts: alertsData,
  };
}

// Write to mock JSON file
const data = generateAllMockData();
const outPath = path.join(__dirname, "..", "mocks", "seed_data.json");
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
console.log(`Successfully generated mock dataset with:
- ${data.cities.length} Cities
- ${data.wards.length} Wards
- ${data.stations.length} Monitoring Stations
- ${data.readings.length} Station Readings (24h)
- ${data.ward_state.length} Ward States (24h hourly)
- ${data.fires.length} Fire Hotspots
- ${data.actions.length} Mitigation Actions
- ${data.alerts.length} Early Warning Alerts
Saved to: ${outPath}`);
