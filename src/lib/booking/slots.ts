import { MINUTES_PER_DAY, parseTimeOfDay } from "./time";

/**
 * Bron vaqtlari (slotlar) jadvalini hisoblash.
 *
 * Bu faqat "qaysi vaqtlarda bron boshlanishi mumkin" degan ro‘yxat. Stol haqiqatan bo‘shmi —
 * buni Sprint 4'da bazadagi funksiya va exclusion constraint hal qiladi; ikki kishi bir stolni
 * band qila olmasligini faqat baza kafolatlaydi.
 */

export type SlotRule = {
  /** Ochilish vaqti, "HH:MM". */
  opensAt: string;
  /** Yopilish vaqti, "HH:MM". Ochilishdan kichik yoki teng bo‘lsa — yarim tundan keyin yopiladi. */
  closesAt: string;
  /** Slotlar oralig‘i, daqiqa (masalan 15 yoki 30). */
  intervalMinutes: number;
  /** Oxirgi bron yopilishdan necha daqiqa oldin boshlanishi mumkin. */
  lastSeatingBeforeCloseMinutes: number;
};

/**
 * Kun boshidan hisoblangan slot boshlanish daqiqalari.
 * Yarim tundan keyingi slotlar 1440 dan katta bo‘ladi (masalan 00:30 → 1470).
 */
export function generateSlotStarts(rule: SlotRule): number[] {
  const { intervalMinutes, lastSeatingBeforeCloseMinutes } = rule;
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 240) {
    throw new Error("Slot oralig‘i 5–240 daqiqa bo‘lishi kerak");
  }
  if (!Number.isInteger(lastSeatingBeforeCloseMinutes) || lastSeatingBeforeCloseMinutes < 0) {
    throw new Error("Oxirgi bron vaqti manfiy bo‘lmasligi kerak");
  }

  const opens = parseTimeOfDay(rule.opensAt);
  let closes = parseTimeOfDay(rule.closesAt);
  if (closes <= opens) closes += MINUTES_PER_DAY;

  const lastStart = closes - lastSeatingBeforeCloseMinutes;
  const starts: number[] = [];
  for (let minute = opens; minute <= lastStart; minute += intervalMinutes) {
    starts.push(minute);
  }
  return starts;
}

export type BookableFilter = {
  /** Tanlangan sana bugunmi (Toshkent vaqti bo‘yicha). */
  isToday: boolean;
  /** Hozirgi vaqt, kun boshidan daqiqa (Toshkent). */
  nowMinutes: number;
  /** Bron kamida necha daqiqa oldin qilinishi kerak. */
  minLeadMinutes: number;
};

/** Bugun uchun o‘tib ketgan yoki juda yaqin slotlarni olib tashlaydi. */
export function filterBookableSlots(starts: number[], filter: BookableFilter): number[] {
  if (!filter.isToday) return starts;
  const earliest = filter.nowMinutes + Math.max(0, filter.minLeadMinutes);
  return starts.filter((start) => start >= earliest);
}

/** Kechki slotlar shu vaqtdan boshlanadi (ekranda ikki guruhga bo‘lish uchun). */
export const EVENING_STARTS_AT = 17 * 60;

export function groupSlotsByPeriod(starts: number[]): { day: number[]; evening: number[] } {
  return {
    day: starts.filter((start) => start < EVENING_STARTS_AT),
    evening: starts.filter((start) => start >= EVENING_STARTS_AT),
  };
}
