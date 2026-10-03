import { useTranslations } from "next-intl";
import {
  PieChart,
  Map,
  Target,
  AlertOctagon,
  Languages,
  ShieldCheck,
} from "lucide-react";

export function FeatureGrid() {
  const t = useTranslations("features");

  const features = [
    {
      icon: PieChart,
      title: t("feat1Title"),
      desc: t("feat1Desc"),
      color: "text-[#D55E00] bg-[#D55E00]/10",
    },
    {
      icon: Map,
      title: t("feat2Title"),
      desc: t("feat2Desc"),
      color: "text-[#0072B2] bg-[#0072B2]/10",
    },
    {
      icon: Target,
      title: t("feat3Title"),
      desc: t("feat3Desc"),
      color: "text-[#E69F00] bg-[#E69F00]/10",
    },
    {
      icon: AlertOctagon,
      title: t("feat4Title"),
      desc: t("feat4Desc"),
      color: "text-[#E03C31] bg-[#E03C31]/10",
    },
    {
      icon: Languages,
      title: t("feat5Title"),
      desc: t("feat5Desc"),
      color: "text-[#0E9AA7] bg-[#0E9AA7]/10",
    },
    {
      icon: ShieldCheck,
      title: t("feat6Title"),
      desc: t("feat6Desc"),
      color: "text-[#1F3A5F] dark:text-[#F8FAFC] bg-[#1F3A5F]/10 dark:bg-card",
    },
  ];

  return (
    <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="rounded-full bg-[#1F3A5F]/10 dark:bg-[#0E9AA7]/10 px-3 py-1 text-xs font-bold text-[#1F3A5F] dark:text-[#0E9AA7] uppercase tracking-wider">
          {t("tag")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-sm hover:border-border transition-all space-y-3.5"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${feat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {feat.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
