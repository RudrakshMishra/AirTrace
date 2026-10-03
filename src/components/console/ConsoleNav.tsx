"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  FileCheck2,
  ScrollText,
  SlidersHorizontal,
  Users,
  FileDown,
} from "lucide-react";
import type { UserRole } from "@/types";

export function ConsoleNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const links = [
    {
      href: "/console",
      label: "Overview",
      icon: LayoutDashboard,
      roles: ["viewer", "officer", "moderator", "city_admin", "state_admin"],
    },
    {
      href: "/console/actions",
      label: "Mitigation Actions",
      icon: ClipboardList,
      roles: ["viewer", "officer", "city_admin", "state_admin"],
    },
    {
      href: "/console/alerts",
      label: "Trap Alerts",
      icon: AlertTriangle,
      roles: ["viewer", "officer", "moderator", "city_admin", "state_admin"],
    },
    {
      href: "/console/reports",
      label: "Citizen Reports",
      icon: FileCheck2,
      roles: ["moderator", "city_admin", "state_admin"],
    },
    {
      href: "/console/settings",
      label: "Rules & Thresholds",
      icon: SlidersHorizontal,
      roles: ["city_admin", "state_admin"],
    },
    {
      href: "/console/audit",
      label: "Audit Logs",
      icon: ScrollText,
      roles: ["state_admin"],
    },
    {
      href: "/console/admin/users",
      label: "Officer Directory",
      icon: Users,
      roles: ["city_admin", "state_admin"],
    },
  ];

  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <nav className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-1">
        {visibleLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/console"
              ? pathname === "/console"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#1F3A5F] text-white shadow-2xs dark:bg-[#0E9AA7]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/api/pdf?cityId=bhopal&lang=en"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
          title="Download City Air Quality Report PDF"
          aria-label="Download City Air Quality Report PDF"
        >
          <FileDown className="h-3.5 w-3.5 text-[#0E9AA7]" />
          <span className="hidden sm:inline">PDF Report</span>
        </a>
      </div>
    </nav>
  );
}
