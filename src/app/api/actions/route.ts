import { NextRequest, NextResponse } from "next/server";
import { getActions } from "@/lib/data";
import { z } from "zod";

const QuerySchema = z.object({
  wardId: z.string().optional(),
  status: z.enum(["open", "in_progress", "done"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      wardId: searchParams.get("wardId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const allActions = await getActions(parsed.data.wardId, parsed.data.status);
    const startIndex = (parsed.data.page - 1) * parsed.data.limit;
    const paginated = allActions.slice(startIndex, startIndex + parsed.data.limit);

    return NextResponse.json({
      success: true,
      total: allActions.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      data: paginated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch actions" },
      { status: 500 }
    );
  }
}
