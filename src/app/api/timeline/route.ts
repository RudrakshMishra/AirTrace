import { NextRequest, NextResponse } from "next/server";
import { getTimeline } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  wardId: z.string().min(1, "wardId is required"),
  hours: z.coerce.number().min(1).max(72).default(24),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      wardId: searchParams.get("wardId"),
      hours: searchParams.get("hours") || 24,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getTimeline(parsed.data.wardId, parsed.data.hours);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
