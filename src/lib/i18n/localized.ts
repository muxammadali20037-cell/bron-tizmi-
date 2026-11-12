import type { Json } from "@/types/database";
import { locales, type Locale } from "./config";

/**
 * Bazadagi ko‘p tilli matndan (`{"uz": "...", "ru": "...", "en": "..."}`) kerakli tilni oladi.
 * Shu tilda bo‘lmasa — o‘zbekcha, keyin ruscha, keyin inglizcha. Hech biri bo‘lmasa — bo‘sh satr.
 */
export function pickLocalized(value: Json | null | undefined, locale: Locale): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const order: Locale[] = [locale, ...locales.filter((l) => l !== locale)];
  for (const key of order) {
    const text = value[key];
    if (typeof text === "string" && text.trim() !== "") return text;
  }
  return "";
}
