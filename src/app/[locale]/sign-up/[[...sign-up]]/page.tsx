import { SignUp } from "@clerk/nextjs";
import { Shield, Wind, ArrowRight, UserPlus } from "lucide-react";
import { IndicativeNotice } from "@/components/ui";
import { isRealClerkKey } from "@/lib/auth/roles";
import Link from "next/link";

export default function SignUpPage() {
  const isReal = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {/* Civic Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-2xs">
          <Shield className="h-3.5 w-3.5 text-[#0E9AA7]" />
          <span>Government of Madhya Pradesh</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F3A5F] text-white dark:bg-[#0E9AA7]">
              <Wind className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F] dark:text-[#F8FAFC]">
              Officer Onboarding
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Register your official government email for operator access
          </p>
        </div>

        <div className="flex justify-center">
          {isReal ? (
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/console"
            />
          ) : (
            <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-md text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E9AA7]/15 text-[#0E9AA7]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Demo Mode Active
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    No registration required in evaluation mode
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                All roles and permissions are pre-configured in demo mode. You can proceed directly to the operator dashboard.
              </p>

              <Link
                href="/console"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3A5F] py-3 font-bold text-white shadow-sm hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] transition-all"
              >
                <span>Proceed to Console</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="pt-2">
          <IndicativeNotice variant="banner" className="text-left text-[11px]" />
        </div>
      </div>
    </div>
  );
}
