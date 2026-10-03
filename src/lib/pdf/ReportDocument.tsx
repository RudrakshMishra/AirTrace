import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface PdfReportData {
  title: string;
  subtitle: string;
  reportId: string;
  generatedAt: string;
  language: "en" | "hi";
  city: string;
  wardName?: string;
  wardNumber?: number;
  aqi: number;
  aqiBand: string;
  primaryPollutant: string;
  sources: {
    vehicular: number;
    industrial: number;
    dust: number;
    biomass: number;
    secondary: number;
  };
  evidence: {
    ventilationIndex: number;
    inversionTrap: boolean;
    mixingHeightMeters: number;
    windSpeedKmh: number;
    windDirection: string;
    thermalAnomaliesCount: number;
    stationsReporting: number;
  };
  actions: Array<{
    title: string;
    department: string;
    priority: string;
    status: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emblemPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0284c7",
    color: "#ffffff",
    textAlign: "center",
    paddingTop: 10,
    fontSize: 10,
    fontWeight: "bold",
  },
  titleArea: {
    marginLeft: 8,
  },
  orgTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  orgSubtitle: {
    fontSize: 8,
    color: "#64748b",
  },
  metaRight: {
    textAlign: "right",
  },
  metaText: {
    fontSize: 8,
    color: "#64748b",
  },
  badgePill: {
    marginTop: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: "bold",
    color: "#0284c7",
    alignSelf: "flex-end",
  },
  banner: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bannerCol: {
    flex: 1,
  },
  aqiBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    padding: 8,
    width: 110,
  },
  aqiValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
  },
  aqiBandText: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    padding: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    padding: 6,
    alignItems: "center",
  },
  sourceBarWrapper: {
    flexDirection: "row",
    height: 14,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  evidenceCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  evidenceLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  evidenceValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },
  disclaimerBox: {
    marginTop: 16,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: "#78350f",
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

function getBandColor(aqi: number): string {
  if (aqi <= 50) return "#15803d"; // Good
  if (aqi <= 100) return "#65a30d"; // Satisfactory
  if (aqi <= 200) return "#d97706"; // Moderate
  if (aqi <= 300) return "#ea580c"; // Poor
  if (aqi <= 400) return "#dc2626"; // Very Poor
  return "#7f1d1d"; // Severe
}

export function AirTracePdfDocument({ data }: { data: PdfReportData }) {
  const isHi = data.language === "hi";
  const bandColor = getBandColor(data.aqi);

  return (
    <Document title={`${data.city} AirTrace Report`} author="AirTrace MP">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.emblemPlaceholder}>MP</Text>
            <View style={styles.titleArea}>
              <Text style={styles.orgTitle}>
                {isHi ? "मध्य प्रदेश वायु गुणवत्ता स्क्रीनिंग रिपोर्ट" : "AIRTRACE MADHYA PRADESH"}
              </Text>
              <Text style={styles.orgSubtitle}>
                {isHi
                  ? "पर्यावरण नियोजन एवं समन्वय संगठन (EPCO) / NCAP सेल"
                  : "State Pollution Screening & Source Attribution Cell • NCAP"}
              </Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>Ref: {data.reportId}</Text>
            <Text style={styles.metaText}>{data.generatedAt}</Text>
            <Text style={styles.badgePill}>
              {isHi ? "आधिकारिक कार्य प्रति" : "OFFICIAL WORKING DRAFT"}
            </Text>
          </View>
        </View>

        {/* Location & AQI Headline */}
        <View style={styles.banner}>
          <View style={styles.bannerCol}>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0f172a" }}>
              {data.wardName ? `${data.wardName} (Ward #${data.wardNumber})` : `${data.city} City Overview`}
            </Text>
            <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
              {isHi ? `शहर: ${data.city} | प्राथमिक प्रदूषक: ${data.primaryPollutant}` : `City: ${data.city} | Dominant Pollutant: ${data.primaryPollutant}`}
            </Text>
            <Text style={{ fontSize: 8.5, color: "#475569", marginTop: 6 }}>
              {isHi
                ? "यह रिपोर्ट नवीनतम वायु गुणवत्ता मॉनिटरिंग, फैलाव मॉडल और उपग्रह थर्मल डिटेक्शन का त्वरित सारांश है।"
                : "Aggregated screening report based on automated sensor telemetry, dispersion models, and satellite thermal anomalies."}
            </Text>
          </View>
          <View style={[styles.aqiBox, { borderColor: bandColor }]}>
            <Text style={[styles.aqiValue, { color: bandColor }]}>{data.aqi}</Text>
            <Text style={[styles.aqiBandText, { color: bandColor }]}>{data.aqiBand}</Text>
            <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 2 }}>CPCB AQI INDEX</Text>
          </View>
        </View>

        {/* Source Breakdown Section */}
        <Text style={styles.sectionTitle}>
          {isHi ? "1. अनुमानित प्रदूषण स्रोत प्रतिशत" : "1. Probable Source Attribution Share"}
        </Text>
        <View style={styles.sourceBarWrapper}>
          <View style={{ flex: data.sources.vehicular, backgroundColor: "#ef4444" }} />
          <View style={{ flex: data.sources.industrial, backgroundColor: "#8b5cf6" }} />
          <View style={{ flex: data.sources.dust, backgroundColor: "#f59e0b" }} />
          <View style={{ flex: data.sources.biomass, backgroundColor: "#10b981" }} />
          <View style={{ flex: data.sources.secondary, backgroundColor: "#64748b" }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 8 }}>Vehicular: {data.sources.vehicular}%</Text>
          <Text style={{ fontSize: 8 }}>Industrial: {data.sources.industrial}%</Text>
          <Text style={{ fontSize: 8 }}>Dust/Construction: {data.sources.dust}%</Text>
          <Text style={{ fontSize: 8 }}>Biomass/Fires: {data.sources.biomass}%</Text>
          <Text style={{ fontSize: 8 }}>Secondary/Other: {data.sources.secondary}%</Text>
        </View>

        {/* Meteorological and Screening Evidence */}
        <Text style={styles.sectionTitle}>
          {isHi ? "2. मौसम एवं फैलाव साक्ष्य" : "2. Meteorological & Screening Evidence"}
        </Text>
        <View style={styles.evidenceGrid}>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>Ventilation Index</Text>
            <Text style={styles.evidenceValue}>{data.evidence.ventilationIndex} m²/s</Text>
            <Text style={{ fontSize: 7, color: data.evidence.ventilationIndex < 6000 ? "#dc2626" : "#16a34a" }}>
              {data.evidence.ventilationIndex < 6000 ? "Poor dispersion condition" : "Adequate atmospheric dispersion"}
            </Text>
          </View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>Thermal Fire Anomalies</Text>
            <Text style={styles.evidenceValue}>{data.evidence.thermalAnomaliesCount} points within buffer</Text>
            <Text style={{ fontSize: 7, color: "#64748b" }}>MODIS / VIIRS satellite feed</Text>
          </View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>Boundary Layer / Mixing Height</Text>
            <Text style={styles.evidenceValue}>{data.evidence.mixingHeightMeters} m</Text>
            <Text style={{ fontSize: 7, color: "#64748b" }}>
              Inversion Trap: {data.evidence.inversionTrap ? "ACTIVE WARNING" : "Normal"}
            </Text>
          </View>
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceLabel}>Surface Wind Vectors</Text>
            <Text style={styles.evidenceValue}>{data.evidence.windSpeedKmh} km/h • {data.evidence.windDirection}</Text>
            <Text style={{ fontSize: 7, color: "#64748b" }}>Directional plume dispersion vector</Text>
          </View>
        </View>

        {/* Priority Recommended Actions */}
        <Text style={styles.sectionTitle}>
          {isHi ? "3. अनुशंसित प्रवर्तन एवं निवारक कार्रवाइयां" : "3. Recommended Enforcement & Mitigation Actions"}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ width: "20%" }}>Priority</Text>
            <Text style={{ width: "45%" }}>Action Title</Text>
            <Text style={{ width: "20%" }}>Department</Text>
            <Text style={{ width: "15%" }}>Status</Text>
          </View>
          {data.actions.slice(0, 5).map((act, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={{ width: "20%", fontWeight: "bold", color: act.priority === "p1" ? "#dc2626" : "#d97706" }}>
                {act.priority.toUpperCase()} - {act.priority === "p1" ? "Immediate" : "Preventive"}
              </Text>
              <Text style={{ width: "45%" }}>{act.title}</Text>
              <Text style={{ width: "20%", color: "#64748b" }}>{act.department}</Text>
              <Text style={{ width: "15%", textTransform: "capitalize" }}>{act.status}</Text>
            </View>
          ))}
        </View>

        {/* Mandatory Statutory Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>
            {isHi ? "सांविधिक अस्वीकरण (STATUTORY DISCLAIMER)" : "STATUTORY DISCLAIMER & DATA NOTICE"}
          </Text>
          <Text style={styles.disclaimerText}>
            {isHi
              ? "संकेतात्मक स्क्रीनिंग, कानूनी स्रोत विभाजन नहीं। यह दस्तावेज़ राष्ट्रीय स्वच्छ वायु कार्यक्रम (NCAP) के तहत त्वरित नगर निगम और प्रदूषण नियंत्रण योजना के लिए सेंसर फ्यूजन, अनुमानित फैलाव मॉडल और उपग्रह अवलोकनों पर आधारित एक स्वचालित प्रारंभिक रिपोर्ट है। कानूनी या विनियामक अभियोजन के लिए संदर्भ प्रयोगशाला विश्लेषण अनिवार्य है।"
              : "Indicative screening, not legal source apportionment. Modelled estimates derived from sensor fusion, dispersion heuristics, and satellite observations for rapid municipal response under NCAP guidelines. Regulatory enforcement and legal proceedings require certified reference-grade laboratory analysis."}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>AirTrace MP • Open Environmental Intelligence Platform</Text>
          <Text>Generated via automated pipeline • Verification code: {data.reportId.slice(0, 8)}</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
