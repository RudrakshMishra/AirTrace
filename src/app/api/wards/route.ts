import { NextRequest, NextResponse } from "next/server";
import { getWards } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  cityId: z.string().min(1, "cityId is required"),
  ts: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      cityId: searchParams.get("cityId"),
      ts: searchParams.get("ts") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getWards(parsed.data.cityId, parsed.data.ts);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wards" },
      { status: 500 }
    );
  }
}
