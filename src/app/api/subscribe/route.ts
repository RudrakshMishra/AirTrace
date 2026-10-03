import { NextRequest, NextResponse } from "next/server";
import { subscribe, SubscribeSchema } from "@/lib/data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit alert subscriptions: max 10 per minute per IP
  const ip = getClientIp(req);
  const rateResult = checkRateLimit(`sub-${ip}`, 10, 60_000);
  if (!rateResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many subscription attempts. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.reset) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

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

    const result = await subscribe(parsed.data);
    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to ward air quality alerts",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to subscribe" },
      { status: 500 }
    );
  }
}
