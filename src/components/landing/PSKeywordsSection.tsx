import { useTranslations } from "next-intl";
import { Wind, Activity, CloudFog, Users2 } from "lucide-react";

export function PSKeywordsSection() {
  const t = useTranslations("psKeywords");

  const keywords = [
    {
      icon: Wind,
      title: t("kw1Title"),
      desc: t("kw1Desc"),
      color: "border-[#0E9AA7]/40 bg-[#0E9AA7]/5",
      textColor: "text-[#0E9AA7]",
    },
    {
      icon: Activity,
      title: t("kw2Title"),
      desc: t("kw2Desc"),
      color: "border-[#1F3A5F]/40 bg-[#1F3A5F]/5 dark:border-[#254977]/60",
      textColor: "text-[#1F3A5F] dark:text-[#F8FAFC]",
    },
    {
      icon: CloudFog,
      title: t("kw3Title"),
      desc: t("kw3Desc"),
      color: "border-[#F28C28]/40 bg-[#F28C28]/5",
      textColor: "text-[#F28C28]",
    },
    {
      icon: Users2,
      title: t("kw4Title"),
      desc: t("kw4Desc"),
      color: "border-[#00B050]/40 bg-[#00B050]/5",
      textColor: "text-[#00B050]",
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-muted/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="rounded-full bg-[#0E9AA7]/10 px-3 py-1 text-xs font-bold text-[#0E9AA7] uppercase tracking-wider">
            {t("tag")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {keywords.map((kw, i) => {
            const Icon = kw.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border p-6 space-y-3 shadow-2xs hover:shadow-xs transition-all ${kw.color}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/80 ${kw.textColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {kw.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {kw.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
