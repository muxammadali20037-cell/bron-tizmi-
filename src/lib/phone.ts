/**
 * O‘zbekiston telefon raqamlari bilan ishlash.
 *
 * Saqlash formati — E.164: "+998901234567".
 * Ko‘rsatish formati — "90 123 45 67" (+998 alohida turadi).
 *
 * Operator kodlari ro‘yxati ataylab tekshirilmaydi: yangi kodlar paydo bo‘lishi mumkin,
 * raqam haqiqatan ishlashini SMS kod tasdiqlaydi (Sprint 3).
 */

export const UZ_COUNTRY_CODE = "998";
export const UZ_NATIONAL_LENGTH = 9;

const INTERNATIONAL_LENGTH = UZ_COUNTRY_CODE.length + UZ_NATIONAL_LENGTH;
const NATIONAL_PATTERN = /^[1-9]\d{8}$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Raqamlar 9 tadan oshsa va 998 bilan boshlansa, bu mamlakat kodi deb olib tashlanadi.
 * Odamlar ko‘pincha "998 90 ..." deb yozishni boshlaydi: 10-raqamga yetganda kod ajratiladi.
 * 9 tagacha raqamga tegmaydi: "99 812 34 56" kabi milliy raqam ham 998 bilan boshlanishi mumkin.
 */
function stripCountryCode(digits: string): { digits: string; removed: number } {
  if (digits.length > UZ_NATIONAL_LENGTH && digits.startsWith(UZ_COUNTRY_CODE)) {
    return { digits: digits.slice(UZ_COUNTRY_CODE.length), removed: UZ_COUNTRY_CODE.length };
  }
  return { digits, removed: 0 };
}

/** "90 123 45 67" ko‘rinishiga keltiradi. Qisman yozilgan raqam ham formatlanadi. */
export function formatNationalPhone(digits: string): string {
  const d = digitsOnly(digits).slice(0, UZ_NATIONAL_LENGTH);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function isValidNationalPhone(digits: string): boolean {
  return NATIONAL_PATTERN.test(digits);
}

/**
 * Har qanday yozuvni E.164 ga keltiradi: "+998 (90) 123-45-67", "998901234567", "90 123 45 67".
 * Raqam noto‘g‘ri bo‘lsa (uzun, qisqa, 0 bilan boshlangan) — null.
 */
export function normalizeUzPhone(input: string): string | null {
  const all = digitsOnly(input);
  let national: string;
  if (all.length === UZ_NATIONAL_LENGTH) {
    national = all;
  } else if (all.length === INTERNATIONAL_LENGTH && all.startsWith(UZ_COUNTRY_CODE)) {
    national = all.slice(UZ_COUNTRY_CODE.length);
  } else {
    return null;
  }
  return isValidNationalPhone(national) ? `+${UZ_COUNTRY_CODE}${national}` : null;
}

/** "+998901234567" → "+998 90 123 45 67". Noto‘g‘ri qiymat o‘zgarishsiz qaytadi. */
export function formatE164ForDisplay(e164: string): string {
  const normalized = normalizeUzPhone(e164);
  if (!normalized) return e164;
  return `+${UZ_COUNTRY_CODE} ${formatNationalPhone(normalized.slice(4))}`;
}

/** Formatlangan matnda n-raqamdan keyingi kursor o‘rni. */
export function caretAfterDigit(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return formatted.length;
}

export type PhoneEdit = {
  /** Oldingi qiymat (faqat milliy raqamlar). */
  previousDigits: string;
  /** Brauzer bergan yangi matn (bo‘shliqlar bilan). */
  rawValue: string;
  /** Yangi matndagi kursor o‘rni. */
  caret: number;
  /** O‘chirish yo‘nalishi (InputEvent.inputType'dan). */
  deletion?: "backward" | "forward";
};

/**
 * Telefon maydonidagi har bir o‘zgarishni qayta ishlaydi va kursor joyini saqlaydi.
 * Bo‘shliq o‘chirilsa, uning yonidagi raqam o‘chiriladi — aks holda Backspace "ishlamay" qolardi.
 */
export function applyPhoneEdit({ previousDigits, rawValue, caret, deletion }: PhoneEdit): {
  digits: string;
  caret: number;
} {
  const stripped = stripCountryCode(digitsOnly(rawValue));
  let digits = stripped.digits;
  let before = Math.max(0, digitsOnly(rawValue.slice(0, caret)).length - stripped.removed);

  if (digits.length > UZ_NATIONAL_LENGTH) {
    // Raqam to‘lgan: ortiqcha belgini qabul qilmaymiz, kursor joyida qoladi
    const inserted = digits.length - previousDigits.length;
    const position = Math.min(Math.max(0, before - inserted), previousDigits.length);
    return {
      digits: previousDigits,
      caret: caretAfterDigit(formatNationalPhone(previousDigits), position),
    };
  }

  const separatorRemoved =
    deletion !== undefined &&
    digits === previousDigits &&
    rawValue.length < formatNationalPhone(previousDigits).length;

  if (separatorRemoved) {
    if (deletion === "backward" && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    } else if (deletion === "forward" && before < digits.length) {
      digits = digits.slice(0, before) + digits.slice(before + 1);
    }
  }

  before = Math.min(before, digits.length);
  return { digits, caret: caretAfterDigit(formatNationalPhone(digits), before) };
}
