import { NextResponse } from "next/server";
import { getCities } from "@/lib/data";

export async function GET() {
  try {
    const data = await getCities();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
