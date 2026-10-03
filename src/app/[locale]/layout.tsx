import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar, Footer, SmoothScroll } from "@/components/layout";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SmoothScroll>
        <div className="flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-xl focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            {locale === "hi" ? "मुख्य सामग्री पर जाएं (Skip to content)" : "Skip to main content"}
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-hidden">
            {children}
          </main>
          <Footer />
        </div>
      </SmoothScroll>
    </NextIntlClientProvider>
  );
}
