import { isLocale, type Locale } from "@/lib/i18n/config";

/**
 * Kirishdan keyin qaytiladigan manzil (`?next=`). Faqat shu saytning ichki sahifasi bo‘lishi
 * mumkin — aks holda havola orqali foydalanuvchini boshqa saytga yo‘naltirib yuborish mumkin
 * (open redirect). Yaroqsiz bo‘lsa, til bosh sahifasi qaytariladi.
 */
export function safeNextPath(raw: string | null | undefined, locale: Locale): string {
  const fallback = `/${locale}`;
  if (!raw || typeof raw !== "string" || raw.length > 512) return fallback;

  // Faqat "/" bilan boshlanadigan nisbiy yo‘l; "//host", "/\host" va boshqarish belgilari taqiqlanadi
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, "https://sofriva.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "https://sofriva.invalid") return fallback;

  const firstSegment = url.pathname.split("/")[1];
  if (!isLocale(firstSegment)) return fallback;

  // Kirish sahifasining o‘ziga qaytish aylanma yo‘l hosil qiladi
  if (/^\/(uz|ru|en)\/login(\/|$)/.test(url.pathname)) return fallback;

  return `${url.pathname}${url.search}`;
}

/** Kirish sahifasi manzili: qaytish joyi bilan. */
export function loginPath(locale: Locale, next?: string): string {
  const safe = next ? safeNextPath(next, locale) : null;
  return safe && safe !== `/${locale}`
    ? `/${locale}/login?next=${encodeURIComponent(safe)}`
    : `/${locale}/login`;
}
