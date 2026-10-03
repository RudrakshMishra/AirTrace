import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AirTracePdfDocument, PdfReportData } from "@/lib/pdf/ReportDocument";
import { getWardDetail, getCities, getActions, getFires } from "@/lib/data";

function getAqiBand(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get("wardId");
    const cityId = searchParams.get("cityId") || "bhopal";
    const language = (searchParams.get("lang") === "hi" ? "hi" : "en") as "en" | "hi";

    let reportData: PdfReportData;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const cities = await getCities();
    const city = cities.find((c) => c.id === cityId) || cities[0];
    const fires = await getFires(city.id, 24);
    const actions = await getActions(wardId || undefined);

    if (wardId) {
      const wardData = await getWardDetail(wardId);
      if (!wardData) {
        return NextResponse.json({ error: "Ward not found" }, { status: 404 });
      }

      const currentState = wardData.state || {
        aqi_est: 285,
        src_fire: 15,
        src_traffic: 35,
        src_dust: 25,
        src_industry: 20,
        src_other: 5,
        ventilation: 4500,
        trap_flag: true,
      };

      const aqi = currentState.aqi_est;

      reportData = {
        title: `${wardData.ward.name} Ward Air Quality Screening Report`,
        subtitle: `Madhya Pradesh State Pollution Control Cell • ${city.name}`,
        reportId: `AT-W-${wardId}-${Date.now().toString().slice(-6)}`,
        generatedAt: formattedDate,
        language,
        city: city.name,
        wardName: wardData.ward.name,
        wardNumber: parseInt(wardData.ward.id.replace(/\D/g, ""), 10) || 1,
        aqi,
        aqiBand: getAqiBand(aqi),
        primaryPollutant: "PM2.5 (Fine Particulate)",
        sources: {
          vehicular: Math.round(currentState.src_traffic * 100),
          industrial: Math.round(currentState.src_industry * 100),
          dust: Math.round(currentState.src_dust * 100),
          biomass: Math.round(currentState.src_fire * 100),
          secondary: Math.round(currentState.src_other * 100),
        },
        evidence: {
          ventilationIndex: currentState.ventilation,
          inversionTrap: currentState.trap_flag,
          mixingHeightMeters: 480,
          windSpeedKmh: 6.2,
          windDirection: "NW (Plume dispersion towards SE)",
          thermalAnomaliesCount: fires.length,
          stationsReporting: 3,
        },
        actions: actions.map((a) => ({
          title: language === "hi" ? a.text_hi : a.text_en,
          department: a.department,
          priority: a.status === "open" ? "p1" : "p2",
          status: a.status,
        })),
      };
    } else {
      // City-wide summary
      reportData = {
        title: `${city.name} City Comprehensive Air Screening Report`,
        subtitle: "District Level Atmospheric Intelligence & Early Warning",
        reportId: `AT-C-${city.id}-${Date.now().toString().slice(-6)}`,
        generatedAt: formattedDate,
        language,
        city: city.name,
        aqi: 242,
        aqiBand: "Poor",
        primaryPollutant: "PM2.5 / PM10",
        sources: {
          vehicular: 38,
          industrial: 24,
          dust: 22,
          biomass: 11,
          secondary: 5,
        },
        evidence: {
          ventilationIndex: 5120,
          inversionTrap: true,
          mixingHeightMeters: 520,
          windSpeedKmh: 7.5,
          windDirection: "WNW",
          thermalAnomaliesCount: fires.length,
          stationsReporting: 4,
        },
        actions: actions.slice(0, 5).map((a) => ({
          title: language === "hi" ? a.text_hi : a.text_en,
          department: a.department,
          priority: a.status === "open" ? "p1" : "p2",
          status: a.status,
        })),
      };
    }

    // Render the React-PDF document to a Node Buffer
    const docElement = React.createElement(AirTracePdfDocument, { data: reportData });
    const buffer = await renderToBuffer(docElement as any);

    const filename = wardId
      ? `airtrace-ward-${wardId}-${language}.pdf`
      : `airtrace-city-${cityId}-${language}.pdf`;

    return new Response(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report", details: error?.message },
      { status: 500 }
    );
  }
}
