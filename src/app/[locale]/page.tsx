import { CalendarCheck, Store } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";

export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { home } = dict;

  const audiences = [
    { key: "customers", icon: CalendarCheck, ...home.customers },
    { key: "restaurants", icon: Store, ...home.restaurants },
  ] as const;

  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Logo />
        <LanguageSwitcher current={locale} label={dict.nav.language} />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pt-10 pb-16 sm:px-8 sm:pt-20">
        <section aria-labelledby="hero-title" className="max-w-3xl">
          <p className="bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <span aria-hidden="true" className="bg-gold size-1.5 rounded-full" />
            {home.status}
          </p>
          <h1
            id="hero-title"
            className="text-navy mt-6 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl"
          >
            {home.title}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
            {home.subtitle}
          </p>
          <p className="text-foreground/80 mt-6 text-sm font-medium tracking-wide">
            {dict.brand.slogan}
          </p>
        </section>

        <section className="mt-14 grid gap-4 sm:mt-20 sm:grid-cols-2">
          {audiences.map(({ key, icon: Icon, title, items }) => (
            <article key={key} className="bg-card rounded-xl border p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="bg-muted text-navy inline-flex size-10 items-center justify-center rounded-lg">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h2 className="text-navy text-lg font-semibold">{title}</h2>
              </div>
              <ul className="text-foreground mt-5 space-y-3">
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

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto w-full max-w-5xl px-5 py-6 text-sm sm:px-8">
          {dict.footer.copyright}
        </div>
      </footer>
    </>
  );
}
