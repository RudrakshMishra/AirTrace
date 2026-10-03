import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Compass, Shield, Wind } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-card via-card/95 to-background py-20 sm:py-24 text-center">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3A5F] text-white shadow-sm dark:bg-[#0E9AA7]">
          <Wind className="h-6 w-6" />
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          {t("title")}
        </h2>

        <p className="mx-auto max-w-2xl text-base text-muted-foreground leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/citizen"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E9AA7] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#0E9AA7]/90 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Compass className="h-4 w-4" />
            <span>{t("citizenBtn")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/console"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground shadow-xs hover:bg-muted active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Shield className="h-4 w-4 text-[#1F3A5F] dark:text-[#0E9AA7]" />
            <span>{t("officerBtn")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
