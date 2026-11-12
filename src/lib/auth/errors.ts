/**
 * Supabase va bazadan kelgan xatolarni foydalanuvchiga tushunarli matn kalitiga aylantiradi.
 * Matnning o‘zi `messages/*.json` dagi `authErrors` va `appErrors` bo‘limlarida (3 tilda).
 * Texnik xabar foydalanuvchiga hech qachon to‘g‘ridan-to‘g‘ri ko‘rsatilmaydi.
 */

export const authErrorKeys = [
  "invalidPhone",
  "tooManySms",
  "smsFailed",
  "codeInvalid",
  "tooManyAttempts",
  "unavailable",
  "generic",
] as const;

export type AuthErrorKey = (typeof authErrorKeys)[number];

type AuthLikeError = { code?: string | null; status?: number | null; message?: string | null };

export function authErrorKey(error: AuthLikeError | null | undefined): AuthErrorKey {
  if (!error) return "generic";
  const message = error.message ?? "";

  // Bizning Send SMS Hook qaytaradigan sabablar
  if (message.includes("too_many_attempts")) return "tooManySms";
  if (message.includes("unsupported_phone")) return "invalidPhone";

  switch (error.code) {
    case "otp_expired":
      return "codeInvalid";
    case "over_sms_send_rate_limit":
      return "tooManySms";
    case "over_request_rate_limit":
      return "tooManyAttempts";
    case "sms_send_failed":
    case "hook_timeout":
    case "hook_timeout_after_retry":
    case "hook_payload_invalid_content_type":
    case "hook_payload_over_size_limit":
      return "smsFailed";
    case "phone_provider_disabled":
    case "otp_disabled":
    case "signup_disabled":
      return "unavailable";
    case "validation_failed":
      return "invalidPhone";
  }

  if (error.status === 429) return "tooManyAttempts";
  return "generic";
}

/** Baza funksiyalari `detail` maydonida qaytaradigan xato kodlari (supabase/migrations/…_auth_staff.sql). */
export const appErrorCodes = [
  "not_authenticated",
  "forbidden",
  "invalid_name",
  "invalid_locale",
  "invalid_phone",
  "already_member",
  "already_invited",
  "invitation_not_found",
  "invitation_not_pending",
  "invitation_expired",
  "restaurant_suspended",
  "cannot_change_self",
  "member_not_found",
  "last_owner",
  "generic",
] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];

type PostgrestLikeError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

export function appErrorCode(error: PostgrestLikeError | null | undefined): AppErrorCode {
  if (!error) return "generic";
  const detail = error.details ?? "";
  if ((appErrorCodes as readonly string[]).includes(detail)) return detail as AppErrorCode;
  if (error.code === "42501") return "forbidden";
  return "generic";
}
