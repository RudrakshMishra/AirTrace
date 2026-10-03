import { NextRequest, NextResponse } from "next/server";
import { validateImageUpload } from "@/lib/upload-validator";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit uploads (max 10 per minute per IP)
  const ip = getClientIp(req);
  const rateResult = checkRateLimit(`upload-${ip}`, 10, 60_000);
  if (!rateResult.success) {
    return NextResponse.json(
      { error: "Too many upload requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.reset) },
      }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form field 'file'" },
        { status: 400 }
      );
    }

    const validation = validateImageUpload({
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // In demo / serverless mode without external S3, convert to safe data URL or storage reference
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const safeDataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: safeDataUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "File upload processing failed" },
      { status: 500 }
    );
  }
}
