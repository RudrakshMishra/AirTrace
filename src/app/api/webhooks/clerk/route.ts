import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn("CLERK_WEBHOOK_SECRET is not set. Webhook verification skipped in demo mode.");
    return NextResponse.json(
      { success: true, message: "Webhook received in demo mode" },
      { status: 200 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix verification headers" },
      { status: 400 }
    );
  }

  // Get raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;

  // Handle user synchronization
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, primary_email_address_id, public_metadata } =
      evt.data;

    const email =
      email_addresses.find((e: any) => e.id === primary_email_address_id)
        ?.email_address || email_addresses[0]?.email_address || "";

    const role = (public_metadata?.role as string) || "viewer";
    const cityId = (public_metadata?.cityId as string) || null;

    if (db) {
      try {
        await db
          .insert(schema.users)
          .values({
            id: `usr-${id}`,
            clerk_id: id,
            email,
            role,
            city_id: cityId,
            created_at: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.users.clerk_id,
            set: {
              email,
              role,
              city_id: cityId,
            },
          });
      } catch (e) {
        console.error("Failed to upsert user in DB:", e);
      }
    }
  } else if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (db && id) {
      try {
        await db.delete(schema.users).where(eq(schema.users.clerk_id, id));
      } catch (e) {
        console.error("Failed to delete user in DB:", e);
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
