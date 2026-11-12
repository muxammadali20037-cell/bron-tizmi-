/**
 * Send SMS Hook uchun sof yordamchilar (Deno va Node'da bir xil ishlaydi, testlanadi).
 * Tarmoq va maxfiy kalitlar bu faylda yo‘q.
 */

export const DEFAULT_SMS_TEMPLATE = "SOFRIVA: kirish kodi {code}. Kodni hech kimga bermang.";

/** Supabase Auth raqamni "998901234567" ko‘rinishida beradi. Faqat O‘zbekiston raqami qabul qilinadi. */
export function toUzE164(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  return /^998[1-9]\d{8}$/.test(digits) ? `+${digits}` : null;
}

/** Eskiz raqamni "+"siz kutadi: 998901234567. */
export function toEskizPhone(e164: string): string {
  return e164.replace(/^\+/, "");
}

/** SMS matni: shablondagi {code} o‘rniga 6 xonali kod. Kod noto‘g‘ri bo‘lsa — null. */
export function buildSmsText(template: string | undefined, otp: unknown): string | null {
  if (typeof otp !== "string" || !/^\d{4,10}$/.test(otp)) return null;
  const text = (template && template.includes("{code}") ? template : DEFAULT_SMS_TEMPLATE).replace(
    "{code}",
    otp,
  );
  return text;
}

/** Supabase Auth hook xato javobi: foydalanuvchiga `message` kodi qaytadi (ilova uni tarjima qiladi). */
export function hookError(httpCode: number, message: string): { status: number; body: string } {
  return {
    status: httpCode,
    body: JSON.stringify({ error: { http_code: httpCode, message } }),
  };
}

/** "v1,whsec_abc|v1,whsec_def" → ["abc", "def"] (kalitni almashtirish paytida ikkalasi ham ishlaydi). */
export function parseHookSecrets(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((part) => part.trim().replace(/^v1,whsec_/, ""))
    .filter(Boolean);
}
