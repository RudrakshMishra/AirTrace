import { NextRequest, NextResponse } from "next/server";
import { getStations } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  cityId: z.string().min(1, "cityId is required"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      cityId: searchParams.get("cityId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getStations(parsed.data.cityId);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
