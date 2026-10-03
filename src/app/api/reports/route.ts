import { NextRequest, NextResponse } from "next/server";
import { createReport, CreateReportSchema } from "@/lib/data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  // Rate limit report submissions: max 10 per minute per IP
  const ip = getClientIp(req);
  const rateResult = checkRateLimit(`reports-${ip}`, 10, 60_000);
  if (!rateResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many reports submitted. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.reset) },
      }
    );
  }

  try {
    const body = await req.json();
    if (body && typeof body.note === "string") {
      body.note = sanitizeText(body.note);
    }
    const parsed = CreateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const report = await createReport(parsed.data);
    return NextResponse.json(
      {
        success: true,
        message: "Report submitted successfully for moderation",
        data: report,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}
