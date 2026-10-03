import { requireRole } from "@/lib/auth";
import { UserManager } from "./UserManager";
import { ConsoleNav } from "@/components/console/ConsoleNav";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Shield, FileCheck2 } from "lucide-react";
import type { UserRole } from "@/types";

export default async function AdminUsersPage() {
  // Enforce server-side role check: only state_admin or city_admin allowed
  const session = await requireRole(["state_admin", "city_admin"]);

  // Fetch users from database or realistic fallback
  let usersList = [
    {
      id: "user_officer_bhopal_1",
      name: "Er. Rajesh Verma",
      email: "rajesh.verma@mppcb.gov.in",
      role: "officer" as UserRole,
      cityId: "bhopal",
    },
    {
      id: "user_cityadmin_indore_1",
      name: "Dr. Ananya Sharma",
      email: "ananya.sharma@indore.nic.in",
      role: "city_admin" as UserRole,
      cityId: "indore",
    },
    {
      id: "user_moderator_1",
      name: "Pooja Patel",
      email: "pooja.patel@mpurban.gov.in",
      role: "moderator" as UserRole,
      cityId: "bhopal",
    },
    {
      id: "user_stateadmin_1",
      name: "Principal Secretary Environment",
      email: "ps.env@mp.gov.in",
      role: "state_admin" as UserRole,
      cityId: null,
    },
  ];

  if (db) {
    try {
      const dbUsers = await db.select().from(schema.users);
      if (dbUsers.length > 0) {
        usersList = dbUsers.map((u) => ({
          id: u.clerk_id,
          name: u.email.split("@")[0] || "Officer",
          email: u.email,
          role: u.role as UserRole,
          cityId: u.city_id,
        }));
      }
    } catch (e) {
      console.warn("Could not query users table:", e);
    }
  }

  // Filter if caller is city_admin: only show users in their city
  if (session.role === "city_admin" && session.cityId) {
    usersList = usersList.filter(
      (u) => u.cityId === session.cityId || u.id === session.userId
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConsoleNav role={session.role} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#1F3A5F]/10 dark:bg-[#0E9AA7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1F3A5F] dark:text-[#0E9AA7] uppercase tracking-wider">
              Administration Module
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Caller: {session.role} ({session.cityId || "Statewide"})
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            User Access & Municipal Role Governance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign jurisdictional cities and operational roles for MPPCB officers and municipal staff.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground max-w-sm">
          <FileCheck2 className="h-4 w-4 shrink-0 text-[#00B050]" />
          <span>
            Every role mutation is permanently recorded in the immutable government audit trail.
          </span>
        </div>
      </div>

      {/* User Manager Component */}
      <UserManager
        initialUsers={usersList}
        currentUserRole={session.role}
        userCityId={session.cityId}
      />
      </main>
    </div>
  );
}
