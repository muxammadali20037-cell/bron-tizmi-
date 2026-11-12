"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth/dal";
import { appErrorCode, type AppErrorCode } from "@/lib/auth/errors";
import { isLocale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InvitationState = { status: "idle" | "done" | "error"; error?: AppErrorCode };

const inputSchema = z.object({
  invitationId: z.uuid(),
  locale: z.string().refine(isLocale),
});

function parse(formData: FormData) {
  return inputSchema.safeParse({
    invitationId: formData.get("invitationId"),
    locale: formData.get("locale"),
  });
}

/** Taklifni qabul qilish: baza telefon raqam mosligini o‘zi tekshiradi. */
export async function acceptInvitationAction(
  _previous: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const input = parse(formData);
  if (!input.success) return { status: "error", error: "invitation_not_found" };
  if (!(await getViewer())) return { status: "error", error: "not_authenticated" };

  const supabase = await createSupabaseServerClient();
  const { data: restaurantId, error } = await supabase.rpc("accept_staff_invitation", {
    p_invitation_id: input.data.invitationId,
  });
  if (error || !restaurantId) return { status: "error", error: appErrorCode(error) };

  redirect(`/${input.data.locale}/os/${restaurantId}`);
}

export async function declineInvitationAction(
  _previous: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const input = parse(formData);
  if (!input.success) return { status: "error", error: "invitation_not_found" };
  if (!(await getViewer())) return { status: "error", error: "not_authenticated" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("decline_staff_invitation", {
    p_invitation_id: input.data.invitationId,
  });
  if (error) return { status: "error", error: appErrorCode(error) };

  refresh();
  return { status: "done" };
}
