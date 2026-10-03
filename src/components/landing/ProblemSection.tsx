import { useTranslations } from "next-intl";
import { EyeOff, HelpCircle, Siren } from "lucide-react";

export function ProblemSection() {
  const t = useTranslations("problem");

  const cards = [
    {
      icon: EyeOff,
      title: t("card1Title"),
      desc: t("card1Desc"),
      accent: "text-[#E03C31] bg-[#E03C31]/10 border-[#E03C31]/20",
    },
    {
      icon: HelpCircle,
      title: t("card2Title"),
      desc: t("card2Desc"),
      accent: "text-[#F28C28] bg-[#F28C28]/10 border-[#F28C28]/20",
    },
    {
      icon: Siren,
      title: t("card3Title"),
      desc: t("card3Desc"),
      accent: "text-[#1F3A5F] dark:text-[#0E9AA7] bg-[#1F3A5F]/10 dark:bg-[#0E9AA7]/10 border-[#1F3A5F]/20",
    },
  ];

  return (
    <section className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
        <span className="rounded-full bg-[#E03C31]/10 px-3 py-1 text-xs font-bold text-[#E03C31] uppercase tracking-wider">
          {t("tag")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${card.accent}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
