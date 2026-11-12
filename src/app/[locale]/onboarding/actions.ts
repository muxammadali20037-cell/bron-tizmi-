"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { appErrorCode, type AppErrorCode } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/next-path";
import { getViewer } from "@/lib/auth/dal";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { switchLocaleInPathname } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error";
  fieldErrors?: { name?: true; consent?: true };
  error?: AppErrorCode;
};

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  locale: z.enum(locales),
  consent: z.literal("on"),
});

/** Ism, til va maxfiylik siyosatiga rozilik. Rozilik vaqtini baza o‘zi yozadi. */
export async function completeOnboardingAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const pageLocaleRaw = formData.get("pageLocale");
  const pageLocale: Locale =
    typeof pageLocaleRaw === "string" && isLocale(pageLocaleRaw) ? pageLocaleRaw : "uz";

  const viewer = await getViewer();
  if (!viewer) redirect(`/${pageLocale}/login`);

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]));
    return {
      status: "error",
      fieldErrors: {
        name: fields.has("fullName") || undefined,
        consent: fields.has("consent") || undefined,
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_full_name: parsed.data.fullName,
    p_locale: parsed.data.locale,
  });
  if (error) return { status: "error", error: appErrorCode(error) };

  // Tanlangan til bilan davom etamiz
  const next = safeNextPath(String(formData.get("next") ?? ""), pageLocale);
  const queryStart = next.indexOf("?");
  const path = queryStart === -1 ? next : next.slice(0, queryStart);
  const query = queryStart === -1 ? "" : next.slice(queryStart);
  redirect(`${switchLocaleInPathname(path, parsed.data.locale)}${query}`);
}
