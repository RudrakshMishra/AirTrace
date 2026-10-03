import { NextRequest, NextResponse } from "next/server";
import { getPriorityWards } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  cityId: z.string().min(1, "cityId is required"),
  ts: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      cityId: searchParams.get("cityId"),
      ts: searchParams.get("ts") || undefined,
      limit: searchParams.get("limit") || 10,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getPriorityWards(
      parsed.data.cityId,
      parsed.data.ts,
      parsed.data.limit
    );
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch priority wards" },
      { status: 500 }
    );
  }
}
