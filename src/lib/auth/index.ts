import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { isRealClerkKey } from "./roles";

export interface AuthSession {
  userId: string | null;
  role: UserRole;
  cityId: string | null;
  email: string | null;
}

/**
 * Get current session user, role, and cityId from Clerk
 */
export async function getAuthSession(): Promise<AuthSession> {
  const isReal = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!isReal) {
    return {
      userId: "demo-officer-id",
      role: "state_admin",
      cityId: "bhopal",
      email: "officer@mppcb.gov.in",
    };
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        userId: null,
        role: "viewer",
        cityId: null,
        email: null,
      };
    }

    const user = await currentUser();
    const metadata = (user?.publicMetadata || {}) as {
      role?: UserRole;
      cityId?: string;
    };

    const primaryEmail =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || user?.emailAddresses[0]?.emailAddress || null;

    return {
      userId,
      role: metadata.role || "viewer",
      cityId: metadata.cityId || null,
      email: primaryEmail,
    };
  } catch (error) {
    console.warn("Clerk auth failed, falling back to demo session:", error);
    return {
      userId: "demo-officer-id",
      role: "state_admin",
      cityId: "bhopal",
      email: "officer@mppcb.gov.in",
    };
  }
}

/**
 * Get the current user's role, defaulting to "viewer"
 */
export async function getRole(): Promise<UserRole> {
  const session = await getAuthSession();
  return session.role;
}

/**
 * Enforce role requirement. Redirects to /access-denied if unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await getAuthSession();
  const isReal = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (isReal && !session.userId) {
    redirect("/sign-in");
  }

  if (isReal && !allowedRoles.includes(session.role)) {
    redirect("/access-denied");
  }

  return session;
}

/**
 * Check if the user can access / modify data for a specific city
 */
export async function canAccessCity(targetCityId: string): Promise<boolean> {
  const session = await getAuthSession();

  // State admin can access all cities in MP
  if (session.role === "state_admin") {
    return true;
  }

  // City admin and officer are bound to their assigned cityId
  if (session.cityId) {
    return session.cityId.toLowerCase() === targetCityId.toLowerCase();
  }

  // Viewer and moderator can view city data by default
  return session.role === "viewer" || session.role === "moderator";
}

export * from "./roles";
