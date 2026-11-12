import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums, Json } from "@/types/database";
import { loginPath, safeNextPath } from "./next-path";
import type { StaffRole } from "./permissions";

/**
 * Data Access Layer: kim kirgan va unga nima ruxsat — faqat shu fayl orqali aniqlanadi.
 * Har bir himoyalangan sahifa va Server Action shu funksiyalarni chaqiradi; proxy'dagi
 * yo‘naltirish faqat qulaylik uchun. Bazadagi RLS — oxirgi himoya qatori.
 */

export type Membership = {
  restaurantId: string;
  slug: string;
  name: Json;
  status: Enums<"restaurant_status">;
  role: StaffRole;
};

export type Viewer = {
  id: string;
  phone: string | null;
  fullName: string | null;
  locale: Locale;
  onboarded: boolean;
  isSuperAdmin: boolean;
  memberships: Membership[];
  pendingInvitations: number;
};

const accessSchema = z.object({
  is_super_admin: z.boolean(),
  memberships: z.array(
    z.object({
      restaurant_id: z.uuid(),
      slug: z.string(),
      name: z.json(),
      status: z.enum(["draft", "pending_review", "published", "rejected", "suspended"]),
      role: z.enum(["owner", "manager", "host", "staff"]),
    }),
  ),
  pending_invitations: z.number().int().nonnegative(),
});

/** Joriy foydalanuvchi (bitta so‘rov ichida bir marta o‘qiladi). Kirmagan bo‘lsa — null. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Har doim so‘rov vaqtida: sozlama bo‘lmasa ham sahifa build paytida "muzlab" qolmasin
  await connection();
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const [profileResult, accessResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, locale, terms_accepted_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.rpc("get_my_access"),
  ]);

  if (profileResult.error)
    throw new Error("Profilni o‘qib bo‘lmadi", { cause: profileResult.error });
  if (accessResult.error)
    throw new Error("Kirish huquqlarini o‘qib bo‘lmadi", { cause: accessResult.error });

  const access = accessSchema.parse(accessResult.data);
  const profile = profileResult.data;

  return {
    id: userId,
    phone: profile?.phone ?? null,
    fullName: profile?.full_name ?? null,
    locale: isLocale(profile?.locale) ? profile.locale : "uz",
    onboarded: Boolean(profile?.terms_accepted_at && profile.full_name),
    isSuperAdmin: access.is_super_admin,
    memberships: access.memberships.map((m) => ({
      restaurantId: m.restaurant_id,
      slug: m.slug,
      name: m.name as Json,
      status: m.status,
      role: m.role,
    })),
    pendingInvitations: access.pending_invitations,
  };
});

/**
 * Kirgan va profilini to‘ldirgan foydalanuvchi. Kirmagan bo‘lsa — kirish sahifasiga,
 * profil to‘ldirilmagan bo‘lsa — onboarding'ga yo‘naltiriladi va keyin shu sahifaga qaytadi.
 */
export async function requireViewer(locale: Locale, currentPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(loginPath(locale, currentPath));
  if (!viewer.onboarded) {
    redirect(`/${locale}/onboarding?next=${encodeURIComponent(safeNextPath(currentPath, locale))}`);
  }
  return viewer;
}

const uuidSchema = z.uuid();

/**
 * Restoran paneli sahifalari uchun: foydalanuvchining shu restorandagi a’zoligi.
 * A’zo bo‘lmasa yoki rol yetmasa `membership: null` — sahifa "ruxsat yo‘q" ko‘rsatadi.
 * Restoran mavjudligini oshkor qilmaslik uchun xabar bir xil.
 */
export async function requireRestaurantAccess(
  locale: Locale,
  restaurantId: string,
  currentPath: string,
  allowedRoles?: readonly StaffRole[],
): Promise<{ viewer: Viewer; membership: Membership | null }> {
  if (!uuidSchema.safeParse(restaurantId).success) notFound();
  const viewer = await requireViewer(locale, currentPath);
  const membership = viewer.memberships.find((m) => m.restaurantId === restaurantId) ?? null;
  if (!membership || (allowedRoles && !allowedRoles.includes(membership.role))) {
    return { viewer, membership: null };
  }
  return { viewer, membership };
}

/** Super Admin sahifalari uchun. Admin bo‘lmasa — null (sahifa "ruxsat yo‘q" ko‘rsatadi). */
export async function requireSuperAdmin(
  locale: Locale,
  currentPath: string,
): Promise<Viewer | null> {
  const viewer = await requireViewer(locale, currentPath);
  return viewer.isSuperAdmin ? viewer : null;
}
