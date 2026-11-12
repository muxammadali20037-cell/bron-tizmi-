import { Suspense } from "react";
import { CalendarCheck, Store } from "lucide-react";
import { AccountNav, AccountNavFallback } from "@/components/auth/account-nav";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { brand } from "@/config/brand";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";

/**
 * Vaqtinchalik bosh sahifa ("Tez orada"). Haqiqiy qidiruv va restoranlar Sprint 10'da
 * bazadagi ma’lumot bilan qo‘shiladi. Bu sahifada ishlamaydigan tugma yo‘q.
 */
export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { home } = dict;

  const audiences = [
    { key: "customers", icon: CalendarCheck, ...home.customers },
    { key: "restaurants", icon: Store, ...home.restaurants },
  ] as const;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language}>
        <Suspense fallback={<AccountNavFallback />}>
          <AccountNav locale={locale} labels={dict.account} />
        </Suspense>
      </SiteHeader>

      <main id="main" className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="bg-forest text-ivory relative overflow-hidden"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="border-ivory/20 text-ivory/85 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span aria-hidden="true" className="bg-gold size-1.5 rounded-full" />
              {home.status}
            </p>
            <h1
              id="hero-title"
              className="font-display mt-6 max-w-3xl text-4xl leading-[1.15] font-semibold text-balance sm:text-6xl"
            >
              {home.title}
            </h1>
            <p className="text-ivory/80 mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
              {interpolate(home.subtitle, { brand: brand.name })}
            </p>
            <p className="font-display text-gold mt-8 text-2xl tracking-wide">{brand.slogan}</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-12 sm:grid-cols-2 sm:px-8 sm:py-16">
          {audiences.map(({ key, icon: Icon, title, items }) => (
            <article key={key} className="bg-card shadow-card rounded-xl border p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="bg-secondary text-primary inline-flex size-10 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="bg-gold mt-2.5 size-1.5 shrink-0 rounded-full"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter copyright={interpolate(dict.footer.copyright, { brand: brand.name })} />
    </>
  );
}
