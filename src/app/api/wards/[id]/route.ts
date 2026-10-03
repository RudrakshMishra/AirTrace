import { NextRequest, NextResponse } from "next/server";
import { getWardDetail } from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const ts = searchParams.get("ts") || undefined;

    const data = await getWardDetail(id, ts);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const status = error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ward detail" },
      { status }
    );
  }
}
