import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isRealClerkKey } from "./lib/auth/roles";
import { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/(en|hi)",
  "/(en|hi)/citizen(.*)",
  "/citizen(.*)",
  "/(en|hi)/hero(.*)",
  "/hero(.*)",
  "/(en|hi)/design(.*)",
  "/design(.*)",
  "/(en|hi)/sign-in(.*)",
  "/sign-in(.*)",
  "/(en|hi)/sign-up(.*)",
  "/sign-up(.*)",
  "/(en|hi)/access-denied(.*)",
  "/access-denied(.*)",
  "/api/public(.*)",
  "/api/cities(.*)",
  "/api/wards(.*)",
  "/api/stations(.*)",
  "/api/fires(.*)",
  "/api/priority(.*)",
  "/api/reports(.*)",
  "/api/subscribe(.*)",
  "/api/timeline(.*)",
  "/api/webhooks/clerk(.*)",
]);

const hasClerk = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const clerkHandler = clerkMiddleware(
  async (auth, req) => {
    // Protect all non-public routes (e.g., /console and administrative endpoints)
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    // Handle locale routing for web pages
    if (!req.nextUrl.pathname.startsWith("/api")) {
      return intlMiddleware(req);
    }
  },
  {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }
);

export default function middleware(req: NextRequest, event: any) {
  if (!hasClerk) {
    // In demo / evaluation mode without live Clerk credentials, bypass remote redirects
    if (!req.nextUrl.pathname.startsWith("/api")) {
      return intlMiddleware(req);
    }
    return;
  }

  return (clerkHandler as any)(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
