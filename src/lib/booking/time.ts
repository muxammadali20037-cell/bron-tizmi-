/**
 * Kun ichidagi vaqt bilan ishlash. Barcha restoranlar hozircha Toshkent vaqtida ishlaydi.
 * Asia/Tashkent — UTC+5, yozgi vaqtga o‘tish yo‘q (1992-yildan beri), shuning uchun
 * doimiy siljish ishonchli.
 */

export const MINUTES_PER_DAY = 24 * 60;
export const TASHKENT_UTC_OFFSET_MINUTES = 5 * 60;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "19:30" → 1170. Noto‘g‘ri format bo‘lsa xato beradi. */
export function parseTimeOfDay(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error(`Vaqt "HH:MM" formatida bo‘lishi kerak: "${value}"`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 1170 → "19:30". Yarim tundan keyingi daqiqalar (1440+) keyingi kun vaqtiga aylanadi. */
export function formatTimeOfDay(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Berilgan lahzadagi Toshkent sanasi ("YYYY-MM-DD") va kun boshidan o‘tgan daqiqalar. */
export function tashkentClock(now: Date): { date: string; minutes: number } {
  const shifted = new Date(now.getTime() + TASHKENT_UTC_OFFSET_MINUTES * 60_000);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}
