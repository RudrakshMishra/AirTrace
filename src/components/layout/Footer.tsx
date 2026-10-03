import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ShieldCheck, ExternalLink, Info } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="border-t border-border bg-card text-card-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#1F3A5F] dark:text-[#0E9AA7]">
                {tCommon("appName")}
              </span>
              <span className="rounded bg-[#F28C28]/10 px-2 py-0.5 text-[10px] font-semibold text-[#F28C28]">
                {tCommon("demoMode")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {t("about")}
            </p>
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-[#0E9AA7] mt-0.5" />
              <span>{t("disclaimer")}</span>
            </div>
          </div>

          {/* Key Departments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("departments")}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://mppcb.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  {t("mppcb")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://mpurban.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  {t("urbanDev")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://health.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  {t("healthDept")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("links")}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/design" className="hover:text-foreground transition-colors">
                  {t("accessibility")}
                </Link>
              </li>
              <li>
                <Link href="/design" className="hover:text-foreground transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/design" className="hover:text-foreground transition-colors">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* GIGW Note & Copyright */}
        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00B050]" />
            <span>{t("gigw")}</span>
          </div>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
