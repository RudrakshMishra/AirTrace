import { NextRequest, NextResponse } from "next/server";
import { getFires } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  cityId: z.string().optional(),
  hours: z.coerce.number().min(1).max(72).default(24),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      cityId: searchParams.get("cityId") || undefined,
      hours: searchParams.get("hours") || 24,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getFires(parsed.data.cityId, parsed.data.hours);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch fires" },
      { status: 500 }
    );
  }
}
