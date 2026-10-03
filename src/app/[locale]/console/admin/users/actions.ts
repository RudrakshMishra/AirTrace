"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types";

export interface UpdateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updateUserRoleAndCity(
  targetClerkId: string,
  newRole: UserRole,
  newCityId?: string
): Promise<UpdateUserResponse> {
  try {
    const session = await requireRole(["state_admin", "city_admin"]);

    // Security check: city_admin can only assign roles within their own city
    if (session.role === "city_admin") {
      if (newRole === "state_admin") {
        return {
          success: false,
          error: "City administrators cannot promote users to State Administrator.",
        };
      }
      if (session.cityId && newCityId && session.cityId !== newCityId) {
        return {
          success: false,
          error: "City administrators can only manage users within their own municipal jurisdiction.",
        };
      }
    }

    // 1. Update Clerk publicMetadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(targetClerkId, {
        publicMetadata: {
          role: newRole,
          cityId: newCityId || null,
        },
      });
    } catch (clerkErr) {
      console.warn("Clerk metadata update failed (may be demo mode):", clerkErr);
    }

    // 2. Insert into audit_log
    if (db && session.userId) {
      try {
        await db.insert(schema.audit_log).values({
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: new Date(),
          actor_clerk_id: session.userId,
          action: "UPDATE_USER_ROLE_AND_CITY",
          entity: "user",
          entity_id: targetClerkId,
          meta_json: {
            assigned_role: newRole,
            assigned_city: newCityId || null,
            actor_role: session.role,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (dbErr) {
        console.warn("Audit log DB insert error:", dbErr);
      }
    }

    revalidatePath("/console/admin/users");
    return {
      success: true,
      message: `Updated user permissions to ${newRole}${newCityId ? ` for ${newCityId}` : ""}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update user role",
    };
  }
}
