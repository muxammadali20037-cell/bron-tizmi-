import { brand } from "@/config/brand";

/**
 * Til sozlamalari. SOFRIVA uchta tilda ishlaydi: o‘zbekcha (asosiy), ruscha, inglizcha.
 * Til har doim URL'ning birinchi qismida turadi: /uz, /ru, /en.
 */
export const locales = ["uz", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uz";

/** Foydalanuvchi tanlagan til shu cookie'da saqlanadi (1 yil). */
export const LOCALE_COOKIE = `${brand.storagePrefix}_locale`;

export const localeLabels: Record<Locale, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
