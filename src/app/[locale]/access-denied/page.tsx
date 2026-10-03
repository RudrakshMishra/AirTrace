import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SignOutButton } from "@clerk/nextjs";
import { isRealClerkKey } from "@/lib/auth/roles";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E03C31]/10 text-[#E03C31]">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="rounded bg-[#E03C31]/10 px-2.5 py-0.5 text-xs font-bold text-[#E03C31] uppercase tracking-wider">
            403 • Authorization Required
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Access Restricted
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your authenticated account does not have sufficient role privileges
            to access the requested console section. Only verified MPPCB,
            municipal officers, or system administrators can view or execute
            mitigation controls.
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground text-left space-y-1">
          <div className="font-semibold text-foreground">
            Authorized roles:
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>State Administrator (`state_admin`)</li>
            <li>City Administrator (`city_admin`)</li>
            <li>Enforcement Officer (`officer`)</li>
            <li>Citizen Report Moderator (`moderator`)</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Portal</span>
          </Link>

          {isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ? (
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E03C31] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#E03C31]/90 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          ) : (
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E03C31] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#E03C31]/90 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
