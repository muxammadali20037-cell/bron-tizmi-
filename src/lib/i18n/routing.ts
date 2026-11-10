import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, isLocale, locales, type Locale } from "./config";

/** URL'ning birinchi qismidan tilni oladi: "/ru/discover" → "ru". Til bo‘lmasa null. */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split("/")[1];
  return isLocale(firstSegment) ? firstSegment : null;
}

/** Brauzerning Accept-Language sarlavhasidan eng mos tilni tanlaydi. */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const requested = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  })
    .languages()
    .filter((tag) => tag !== "*");

  if (requested.length === 0) return defaultLocale;

  try {
    const matched = match(requested, locales, defaultLocale);
    return isLocale(matched) ? matched : defaultLocale;
  } catch {
    // Noto‘g‘ri til kodlari (masalan, "xx-!!") kelganda asosiy tilga qaytamiz.
    return defaultLocale;
  }
}

/**
 * Tilsiz manzilga kelgan foydalanuvchi uchun til: avval saqlangan tanlov (cookie),
 * keyin brauzer tili, oxirida o‘zbekcha.
 */
export function pickLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return negotiateLocale(acceptLanguage);
}

/** Joriy manzilni boshqa tilga o‘tkazadi: ("/ru/discover", "uz") → "/uz/discover". */
export function switchLocaleInPathname(pathname: string, target: Locale): string {
  const current = getLocaleFromPathname(pathname);
  if (!current) {
    return `/${target}${pathname === "/" ? "" : pathname}`;
  }
  const rest = pathname.slice(current.length + 1);
  return `/${target}${rest}`;
}
