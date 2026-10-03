import { NextRequest, NextResponse } from "next/server";
import { getAlerts } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  wardId: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      wardId: searchParams.get("wardId") || undefined,
      severity: searchParams.get("severity") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const allAlerts = await getAlerts(parsed.data.wardId, parsed.data.severity);
    const startIndex = (parsed.data.page - 1) * parsed.data.limit;
    const paginated = allAlerts.slice(startIndex, startIndex + parsed.data.limit);

    return NextResponse.json({
      success: true,
      total: allAlerts.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      data: paginated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
