import type { Enums } from "@/types/database";

export type StaffRole = Enums<"staff_role">;

/** Rollar ahamiyat tartibida (ro‘yxat va tanlash maydonlari uchun). */
export const staffRoles = [
  "owner",
  "manager",
  "host",
  "staff",
] as const satisfies readonly StaffRole[];

/**
 * Kim kimni boshqaradi. Bazadagi `private.can_manage_role` bilan bir xil:
 * owner — hammani, manager — faqat host va staff'ni. Baza baribir o‘zi tekshiradi;
 * bu funksiya interfeysda ruxsat etilmagan tugmalarni ko‘rsatmaslik uchun.
 */
export function canManageRole(actor: StaffRole | null | undefined, target: StaffRole): boolean {
  if (actor === "owner") return true;
  if (actor === "manager") return target === "host" || target === "staff";
  return false;
}

/** Taklif bilan berish mumkin bo‘lgan rollar (owner taklif bilan berilmaydi). */
export function invitableRoles(actor: StaffRole | null | undefined): StaffRole[] {
  return staffRoles.filter((role) => role !== "owner" && canManageRole(actor, role));
}

/** Jamoa sahifasini ko‘rish va xodim taklif qilish. */
export function canManageStaff(actor: StaffRole | null | undefined): boolean {
  return actor === "owner" || actor === "manager";
}

/** Xodim rolini o‘zgartirish — faqat restoran egasi. */
export function canChangeRoles(actor: StaffRole | null | undefined): boolean {
  return actor === "owner";
}
