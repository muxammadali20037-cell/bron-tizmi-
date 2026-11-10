/**
 * Bron va stol holatlari. Bu ro‘yxatlar Sprint 4'dagi bazadagi enum va trigger bilan bir xil
 * bo‘lishi shart: baza o‘tishlarni o‘zi ham tekshiradi, bu yerdagi funksiya faqat interfeysda
 * ruxsat etilmagan tugmalarni ko‘rsatmaslik uchun.
 */

export const reservationStatuses = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "rejected",
  "expired",
  "no_show",
] as const;

export type ReservationStatus = (typeof reservationStatuses)[number];

/** Stolni band qilib turadigan holatlar (exclusion constraint shu holatlarda ishlaydi). */
export const blockingStatuses = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "checked_in",
] as const satisfies readonly ReservationStatus[];

const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ["awaiting_payment", "confirmed", "rejected", "cancelled", "expired"],
  awaiting_payment: ["confirmed", "cancelled", "expired"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
  expired: [],
  no_show: [],
};

export function isBlockingStatus(status: ReservationStatus): boolean {
  return (blockingStatuses as readonly ReservationStatus[]).includes(status);
}

export function isFinalStatus(status: ReservationStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: ReservationStatus): readonly ReservationStatus[] {
  return TRANSITIONS[from];
}

/**
 * Stolning tanlangan vaqt oralig‘idagi holati (zal xaritasi uchun):
 *  - available   — bo‘sh, tanlash mumkin;
 *  - reserved    — oraliq bilan kesishadigan faol bron bor;
 *  - occupied    — mehmon hozir o‘tiribdi (checked_in), faqat "hozir" ko‘rinishida;
 *  - blocked     — xodim stolni shu oraliqqa vaqtincha yopgan;
 *  - unavailable — stol o‘chirilgan, kishi soni to‘g‘ri kelmaydi yoki zal yopiq.
 */
export const tableStatuses = [
  "available",
  "reserved",
  "occupied",
  "blocked",
  "unavailable",
] as const;

export type TableStatus = (typeof tableStatuses)[number];
