"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/dal";
import { appErrorCode, type AppErrorCode } from "@/lib/auth/errors";
import { staffRoles } from "@/lib/auth/permissions";
import { normalizeUzPhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Jamoani boshqarish. Har bir amal bazadagi funksiyani foydalanuvchi nomidan chaqiradi —
 * kim nimaga haqli ekanini baza o‘zi tekshiradi (owner/manager qoidalari, oxirgi egasi va h.k.).
 */

export type StaffActionState = {
  status: "idle" | "done" | "error";
  error?: AppErrorCode;
  /** Muvaffaqiyatli amal turi — tegishli xabarni ko‘rsatish uchun. */
  kind?: "invited" | "revoked" | "roleChanged" | "activated" | "deactivated";
  /** Har bir natija yangi bo‘lishi uchun (bir xil xabar ketma-ket ko‘rsatilsin). */
  at?: number;
};

const uuid = z.uuid();
const role = z.enum(staffRoles);

async function ensureSignedIn(): Promise<StaffActionState | null> {
  return (await getViewer()) ? null : { status: "error", error: "not_authenticated" };
}

function done(kind: NonNullable<StaffActionState["kind"]>): StaffActionState {
  refresh();
  return { status: "done", kind, at: Date.now() };
}

export async function inviteStaffAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const restaurantId = uuid.safeParse(formData.get("restaurantId"));
  const invitedRole = role.safeParse(formData.get("role"));
  const phone = normalizeUzPhone(String(formData.get("phone") ?? ""));
  if (!restaurantId.success || !invitedRole.success) return { status: "error", error: "generic" };
  if (!phone) return { status: "error", error: "invalid_phone" };

  const denied = await ensureSignedIn();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("invite_staff", {
    p_restaurant_id: restaurantId.data,
    p_phone: phone,
    p_role: invitedRole.data,
  });
  if (error) return { status: "error", error: appErrorCode(error) };
  return done("invited");
}

export async function revokeInvitationAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const invitationId = uuid.safeParse(formData.get("invitationId"));
  if (!invitationId.success) return { status: "error", error: "invitation_not_found" };

  const denied = await ensureSignedIn();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_staff_invitation", {
    p_invitation_id: invitationId.data,
  });
  if (error) return { status: "error", error: appErrorCode(error) };
  return done("revoked");
}

export async function setStaffRoleAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const restaurantId = uuid.safeParse(formData.get("restaurantId"));
  const userId = uuid.safeParse(formData.get("userId"));
  const newRole = role.safeParse(formData.get("role"));
  if (!restaurantId.success || !userId.success || !newRole.success) {
    return { status: "error", error: "member_not_found" };
  }

  const denied = await ensureSignedIn();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_staff_member_role", {
    p_restaurant_id: restaurantId.data,
    p_user_id: userId.data,
    p_role: newRole.data,
  });
  if (error) return { status: "error", error: appErrorCode(error) };
  return done("roleChanged");
}

export async function setStaffActiveAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const restaurantId = uuid.safeParse(formData.get("restaurantId"));
  const userId = uuid.safeParse(formData.get("userId"));
  const active = formData.get("active");
  if (!restaurantId.success || !userId.success || (active !== "true" && active !== "false")) {
    return { status: "error", error: "member_not_found" };
  }

  const denied = await ensureSignedIn();
  if (denied) return denied;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_staff_member_active", {
    p_restaurant_id: restaurantId.data,
    p_user_id: userId.data,
    p_active: active === "true",
  });
  if (error) return { status: "error", error: appErrorCode(error) };
  return done(active === "true" ? "activated" : "deactivated");
}
