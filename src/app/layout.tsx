import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { inter, notoSansDevanagari } from "./fonts";
import { isRealClerkKey } from "@/lib/auth/roles";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirTrace MP | Madhya Pradesh Air Quality & Source Attribution",
  description:
    "Ward-level air quality tracking, pollution source screening, and citizen advisory for Madhya Pradesh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isReal = isRealClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const body = (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSansDevanagari.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );

  if (!isReal) {
    return body;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        layout: {
          socialButtonsVariant: "iconButton",
          logoPlacement: "inside",
        },
        variables: {
          colorPrimary: "#1F3A5F",
          colorText: "#0F172A",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-inter), sans-serif",
        },
        elements: {
          card: "border border-border/80 shadow-md rounded-xl bg-card",
          headerTitle: "text-[#1F3A5F] dark:text-[#F8FAFC] font-bold text-xl",
          headerSubtitle: "text-muted-foreground text-xs",
          formButtonPrimary:
            "bg-[#1F3A5F] hover:bg-[#1F3A5F]/90 text-white font-semibold text-sm shadow-xs",
          footerActionLink: "text-[#0E9AA7] hover:underline",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
