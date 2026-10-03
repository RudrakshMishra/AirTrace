"use client";

import * as React from "react";
import { updateUserRoleAndCity } from "./actions";
import type { UserRole } from "@/types";
import { Shield, MapPin, CheckCircle2, AlertCircle, Save, Loader2 } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  role: UserRole;
  cityId: string | null;
  name: string;
}

export function UserManager({
  initialUsers,
  currentUserRole,
  userCityId,
}: {
  initialUsers: UserItem[];
  currentUserRole: UserRole;
  userCityId: string | null;
}) {
  const [users, setUsers] = React.useState<UserItem[]>(initialUsers);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const availableRoles: { value: UserRole; label: string }[] = [
    { value: "state_admin", label: "State Admin (MP State Level)" },
    { value: "city_admin", label: "City Admin (Municipal Nodal)" },
    { value: "officer", label: "Field Enforcement Officer" },
    { value: "moderator", label: "Citizen Report Moderator" },
    { value: "viewer", label: "Read-Only Viewer" },
  ];

  const availableCities = [
    { id: "bhopal", label: "Bhopal" },
    { id: "indore", label: "Indore" },
    { id: "singrauli", label: "Singrauli" },
  ];

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleCityChange = (userId: string, newCity: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, cityId: newCity || null } : u
      )
    );
  };

  const handleSave = async (user: UserItem) => {
    setLoadingId(user.id);
    setNotification(null);

    const res = await updateUserRoleAndCity(
      user.id,
      user.role,
      user.cityId || undefined
    );

    setLoadingId(null);
    if (res.success) {
      setNotification({
        type: "success",
        message: res.message || "Permissions updated successfully",
      });
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to update permissions",
      });
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3.5 text-xs font-medium border ${
            notification.type === "success"
              ? "border-[#00B050]/30 bg-[#00B050]/10 text-[#00B050]"
              : "border-[#E03C31]/30 bg-[#E03C31]/10 text-[#E03C31]"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3.5">User</th>
              <th className="px-4 py-3.5">Assigned Role</th>
              <th className="px-4 py-3.5">Jurisdiction City</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((user) => {
              const isLoading = loadingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">
                      {user.name}
                    </div>
                    <div className="text-muted-foreground text-[11px] font-mono">
                      {user.email}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRole)
                      }
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {availableRoles.map((r) => (
                        <option
                          key={r.value}
                          value={r.value}
                          disabled={
                            currentUserRole === "city_admin" &&
                            r.value === "state_admin"
                          }
                        >
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={user.cityId || ""}
                      onChange={(e) =>
                        handleCityChange(user.id, e.target.value)
                      }
                      disabled={isLoading || user.role === "state_admin"}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {user.role === "state_admin" ? (
                        <option value="">All MP State Cities</option>
                      ) : (
                        <>
                          <option value="">Select City</option>
                          {availableCities.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              disabled={
                                currentUserRole === "city_admin" &&
                                userCityId !== c.id
                              }
                            >
                              {c.label}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSave(user)}
                      disabled={isLoading}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F3A5F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>Save</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
