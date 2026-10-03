"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NavbarAuth } from "./NavbarAuth";
import { Wind, Shield } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 40);

      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((currentScroll / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/citizen", label: t("citizen") },
    { href: "/console", label: t("console") },
    { href: "/design", label: t("design") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Scroll Progress Bar */}
      <div
        className="h-1 bg-gradient-to-r from-[#0E9AA7] via-[#1F3A5F] to-[#F28C28] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page reading progress"
      />

      <nav
        className={`w-full transition-all duration-200 border-b border-border ${
          isScrolled
            ? "h-14 bg-background/90 backdrop-blur-md shadow-sm"
            : "h-18 bg-background"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Civic Branding */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F3A5F] text-white shadow-sm dark:bg-[#0E9AA7]">
              <Wind className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-bold tracking-tight text-[#1F3A5F] dark:text-[#F8FAFC]">
                {tCommon("appName")}
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1">
                <Shield className="h-2.5 w-2.5 text-[#0E9AA7]" />
                {locale === "hi" ? "म.प्र. शासन" : "Govt of MP"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <NavbarAuth signInLabel={t("signIn")} />
          </div>
        </div>
      </nav>
    </header>
  );
}
