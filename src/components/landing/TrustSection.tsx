import { useTranslations } from "next-intl";
import { Code, Scale, ShieldCheck, Eye } from "lucide-react";

export function TrustSection() {
  const t = useTranslations("trust");

  const pillars = [
    {
      icon: Code,
      title: t("openDataTitle"),
      desc: t("openDataDesc"),
    },
    {
      icon: Scale,
      title: t("statutoryTitle"),
      desc: t("statutoryDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("privacyTitle"),
      desc: t("privacyDesc"),
    },
    {
      icon: Eye,
      title: t("accessibilityTitle"),
      desc: t("accessibilityDesc"),
    },
  ];

  return (
    <section className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="rounded-full bg-[#00B050]/10 px-3 py-1 text-xs font-bold text-[#00B050] uppercase tracking-wider">
          {t("tag")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B050]/10 text-[#00B050]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {p.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
