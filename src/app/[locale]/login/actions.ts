"use server";

import { redirect } from "next/navigation";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/next-path";
import { isSupabaseConfigured } from "@/lib/env";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { normalizeUzPhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RequestCodeState =
  | { status: "idle" }
  | { status: "sent"; phone: string; sentAt: number }
  | { status: "error"; error: AuthErrorKey; phone?: string };

export type VerifyCodeState =
  { status: "idle" } | { status: "error"; error: AuthErrorKey | "codeRequired" };

function readLocale(formData: FormData): Locale {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : "uz";
}

/** 1-qadam: telefon raqamga SMS kod yuborish (yangi raqam bo‘lsa hisob ochiladi). */
export async function requestCodeAction(
  _previous: RequestCodeState,
  formData: FormData,
): Promise<RequestCodeState> {
  if (!isSupabaseConfigured()) return { status: "error", error: "unavailable" };

  const phone = normalizeUzPhone(String(formData.get("phone") ?? ""));
  if (!phone) return { status: "error", error: "invalidPhone" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: "sms", shouldCreateUser: true },
  });

  if (error) return { status: "error", error: authErrorKey(error), phone };
  return { status: "sent", phone, sentAt: Date.now() };
}

/** 2-qadam: kodni tekshirish. To‘g‘ri bo‘lsa sessiya cookie'ga yoziladi va sahifaga qaytiladi. */
export async function verifyCodeAction(
  _previous: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  if (!isSupabaseConfigured()) return { status: "error", error: "unavailable" };

  const locale = readLocale(formData);
  const next = safeNextPath(String(formData.get("next") ?? ""), locale);
  const phone = normalizeUzPhone(String(formData.get("phone") ?? ""));
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!phone) return { status: "error", error: "invalidPhone" };
  if (token.length !== 6) return { status: "error", error: "codeRequired" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user) return { status: "error", error: authErrorKey(error) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, terms_accepted_at")
    .eq("id", data.user.id)
    .maybeSingle();

  const onboarded = Boolean(profile?.full_name && profile.terms_accepted_at);
  redirect(onboarded ? next : `/${locale}/onboarding?next=${encodeURIComponent(next)}`);
}

/** Hisobdan chiqish (shu qurilmada). */
export async function signOutAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect(`/${locale}`);
}
