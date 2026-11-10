"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { switchLocaleInPathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  current: Locale;
  label: string;
};

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

/** Tilni almashtiradi va foydalanuvchini o‘sha sahifaning boshqa til versiyasiga olib o‘tadi. */
export function LanguageSwitcher({ current, label }: Props) {
  const pathname = usePathname() ?? `/${current}`;

  return (
    <nav aria-label={label}>
      <ul className="bg-card flex items-center gap-1 rounded-full border p-1 text-sm">
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={switchLocaleInPathname(pathname, locale)}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                onClick={() => rememberLocale(locale)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full px-3 font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{locale.toUpperCase()}</span>
                <span className="hidden sm:inline">{localeLabels[locale]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
