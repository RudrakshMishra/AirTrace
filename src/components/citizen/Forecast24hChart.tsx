"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { WardStateDto } from "@/lib/data/schemas";

export function Forecast24hChart({
  timeline,
  largeText,
}: {
  timeline: WardStateDto[];
  largeText: boolean;
}) {
  const chartData = timeline.map((ws, i) => {
    const d = new Date(ws.ts);
    const hour = d.getHours();
    const timeLabel = `${hour}:00`;

    return {
      time: timeLabel,
      aqi: ws.aqi_est,
      pm25: ws.pm25_est,
      isTrap: ws.trap_flag,
    };
  });

  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: largeText ? 12 : 10, fill: "currentColor" }}
            interval={3}
            stroke="#94A3B8"
          />
          <YAxis
            tick={{ fontSize: largeText ? 12 : 10, fill: "currentColor" }}
            domain={[0, 450]}
            stroke="#94A3B8"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card p-2 text-xs shadow-md space-y-1">
                    <div className="font-bold text-foreground">{data.time}</div>
                    <div className="font-mono text-[#0E9AA7]">AQI: {data.aqi}</div>
                    <div className="text-[10px] text-muted-foreground">
                      PM2.5: {data.pm25} µg/m³
                    </div>
                    {data.isTrap && (
                      <div className="text-[10px] font-bold text-[#E03C31]">
                        ⚠️ Inversion Trap
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Reference line for Poor AQI threshold */}
          <ReferenceLine y={200} stroke="#F28C28" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#0E9AA7"
            strokeWidth={3}
            dot={{ r: 2, fill: "#0E9AA7" }}
            activeDot={{ r: 5, fill: "#F28C28" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
