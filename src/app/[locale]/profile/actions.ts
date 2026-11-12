"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth/dal";
import { isLocale, locales } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileState = { status: "idle" | "saved" | "error"; nameError?: true };

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  locale: z.enum(locales),
});

/** Ism va tilni yangilash. Telefon bu yerda o‘zgarmaydi (u kirish uchun ishlatiladi). */
export async function updateProfileAction(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const pageLocaleRaw = String(formData.get("pageLocale") ?? "");
  const pageLocale = isLocale(pageLocaleRaw) ? pageLocaleRaw : "uz";

  const viewer = await getViewer();
  if (!viewer) redirect(`/${pageLocale}/login`);

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { status: "error", nameError: true };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, locale: parsed.data.locale })
    .eq("id", viewer.id);
  if (error) return { status: "error" };

  if (parsed.data.locale !== pageLocale) redirect(`/${parsed.data.locale}/profile`);
  refresh();
  return { status: "saved" };
}
