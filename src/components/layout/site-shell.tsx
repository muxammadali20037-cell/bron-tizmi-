import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { brand } from "@/config/brand";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Klaviatura foydalanuvchisi uchun: Tab bosilganda birinchi ko‘rinadigan havola. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {label}
    </a>
  );
}

/** Mijoz tomonidagi sahifalar sarlavhasi: logotip (bosh sahifaga havola) va til tanlash. */
export function SiteHeader({
  locale,
  languageLabel,
  className,
  children,
}: {
  locale: Locale;
  languageLabel: string;
  className?: string;
  /** O‘ng tomondagi qo‘shimcha elementlar (keyingi sprintlarda: kirish, Bronlarim). */
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8",
        className,
      )}
    >
      <Link href={`/${locale}`} className="rounded-lg" aria-label={brand.name}>
        <Logo />
      </Link>
      <div className="flex items-center gap-2">
        {children}
        <LanguageSwitcher current={locale} label={languageLabel} />
      </div>
    </header>
  );
}

export function SiteFooter({ copyright }: { copyright: string }) {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>{copyright}</span>
        <span>{brand.slogan}</span>
      </div>
    </footer>
  );
}
