/**
 * Brend sozlamalari — bitta joyda (ADR 0003).
 *
 * "SOFRIVA" hozircha ishchi nom: huquqiy tekshiruv (tovar belgisi, domen) parallel ketmoqda.
 * Nom o‘zgarsa, shu fayl va tarjima fayllaridagi matnlar almashtiriladi.
 * Domen hali sotib olinmagan, shuning uchun bu yerda yozilmagan.
 */
export const brand = {
  name: "SOFRIVA",
  slogan: "Every Table. Better Connected.",
  /** Cookie va localStorage kalitlari uchun prefiks. */
  storagePrefix: "sofriva",
  /** Brauzer paneli rangi (Deep Forest). */
  themeColor: "#0F3D34",
  colors: {
    forest: "#0F3D34",
    gold: "#D4AF7C",
    ivory: "#F8F7F4",
    charcoal: "#1F2937",
    sage: "#587B70",
  },
} as const satisfies {
  name: string;
  slogan: string;
  storagePrefix: string;
  themeColor: string;
  colors: Record<string, string>;
};
