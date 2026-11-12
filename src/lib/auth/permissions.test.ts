import { describe, expect, it } from "vitest";
import {
  canChangeRoles,
  canManageRole,
  canManageStaff,
  invitableRoles,
  staffRoles,
  type StaffRole,
} from "./permissions";
import { Constants } from "@/types/database";

describe("rollar", () => {
  it("bazadagi staff_role enum bilan bir xil", () => {
    expect([...staffRoles]).toEqual([...Constants.public.Enums.staff_role]);
  });

  // Bazadagi private.can_manage_role jadvali bilan aynan bir xil bo‘lishi shart
  const matrix: Record<StaffRole, StaffRole[]> = {
    owner: ["owner", "manager", "host", "staff"],
    manager: ["host", "staff"],
    host: [],
    staff: [],
  };

  it.each(staffRoles)("%s kimni boshqaradi", (actor) => {
    const allowed = staffRoles.filter((target) => canManageRole(actor, target));
    expect(allowed).toEqual(matrix[actor]);
  });

  it("rolsiz foydalanuvchi hech kimni boshqarmaydi", () => {
    expect(staffRoles.some((target) => canManageRole(null, target))).toBe(false);
    expect(invitableRoles(undefined)).toEqual([]);
  });

  it("taklif bilan owner berilmaydi", () => {
    expect(invitableRoles("owner")).toEqual(["manager", "host", "staff"]);
    expect(invitableRoles("manager")).toEqual(["host", "staff"]);
    expect(invitableRoles("host")).toEqual([]);
  });

  it("jamoa sahifasi va rol o‘zgartirish huquqi", () => {
    expect(staffRoles.filter(canManageStaff)).toEqual(["owner", "manager"]);
    expect(staffRoles.filter(canChangeRoles)).toEqual(["owner"]);
  });
});
