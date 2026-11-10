import type { Locale } from "./config";

/** "{name}" ko‘rinishidagi joylarni qiymat bilan almashtiradi. Noma’lum kalit o‘zgarishsiz qoladi. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

/** Ko‘plik shakllari. Ruscha uchun one/few/many kerak, o‘zbek va inglizchada ba’zilari bir xil. */
export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

/** Sonni tilga mos shakl bilan yozadi: ru 1 гость / 2 гостя / 5 гостей. */
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(locale).select(count);
  const template = Object.hasOwn(forms, category)
    ? forms[category as keyof PluralForms]
    : forms.other;
  return interpolate(template, { count });
}
