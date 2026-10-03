import type { UserRole } from "@/types";

export function canUpdateActions(role: UserRole): boolean {
  return ["officer", "city_admin", "state_admin"].includes(role);
}

export function canModerateReports(role: UserRole): boolean {
  return ["moderator", "city_admin", "state_admin"].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return ["city_admin", "state_admin"].includes(role);
}

export function isRealClerkKey(key?: string): boolean {
  if (!key) return false;
  if (!key.startsWith("pk_")) return false;
  if (
    key.includes("YWlydHJhY2UtZGVtby") ||
    key.includes("example") ||
    key.includes("demo")
  ) {
    return false;
  }
  return true;
}
