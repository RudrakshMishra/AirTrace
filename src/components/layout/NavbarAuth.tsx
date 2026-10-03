"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { User, Shield } from "lucide-react";
import { isRealClerkKey } from "@/lib/auth/roles";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function NavbarAuth({ signInLabel }: { signInLabel: string }) {
  const [mounted, setMounted] = React.useState(false);
  const isReal = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isReal || !mounted) {
    return (
      <Link
        href="/console"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1F3A5F] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 transition-colors"
      >
        <Shield className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Officer Console</span>
      </Link>
    );
  }

  return (
    <>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8 ring-2 ring-[#0E9AA7]/50",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <Link
          href="/sign-in"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1F3A5F] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#1F3A5F]/90 dark:bg-[#0E9AA7] dark:hover:bg-[#0E9AA7]/90 transition-colors"
        >
          <User className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{signInLabel}</span>
        </Link>
      </SignedOut>
    </>
  );
}
