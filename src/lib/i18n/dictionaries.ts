import { locale as rootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

type Dictionary = typeof import("@/messages/uz.json");

/**
 * Tarjima fayllari faqat serverda yuklanadi, brauzerga JavaScript sifatida yuborilmaydi.
 * ru va en fayllari uz bilan bir xil tuzilishga ega bo‘lishi shart (TypeScript va test tekshiradi).
 */
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  uz: () => import("@/messages/uz.json").then((m) => m.default),
  ru: () => import("@/messages/ru.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
};

export type { Dictionary };

/** Joriy sahifaning tili (URL'dan). Noma'lum til bo‘lsa 404. */
export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale]();
}
