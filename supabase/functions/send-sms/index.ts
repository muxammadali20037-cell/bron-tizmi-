// Supabase Auth "Send SMS Hook": kirish kodini Eskiz orqali yuboradi.
//
// Oqim: Supabase Auth → (imzolangan so‘rov) → shu funksiya → limit tekshiruvi (baza) → Eskiz → SMS.
// Imzo Standard Webhooks bo‘yicha tekshiriladi; imzosiz so‘rov rad etiladi.
//
// Maxfiy sozlamalar (Supabase → Edge Functions → Secrets):
//   SEND_SMS_HOOK_SECRET  — Auth → Hooks'da yaratilgan "v1,whsec_..." kalit
//   ESKIZ_EMAIL, ESKIZ_PASSWORD — Eskiz kabinetidagi login
//   ESKIZ_FROM            — jo‘natuvchi nomi (ixtiyoriy, standart "4546")
//   SMS_TEMPLATE          — Eskiz tasdiqlagan matn, {code} bilan (ixtiyoriy)
// SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni Supabase o‘zi beradi.

import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";
import { buildSmsText, hookError, parseHookSecrets, toEskizPhone, toUzE164 } from "./lib.ts";

const ESKIZ_API = "https://notify.eskiz.uz/api";

const hookSecrets = parseHookSecrets(Deno.env.get("SEND_SMS_HOOK_SECRET"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Eskiz tokeni 30 kun amal qiladi; funksiya nusxasi yashayotgan paytda qayta ishlatiladi
let eskizToken: string | null = null;

async function eskizLogin(): Promise<string> {
  const email = Deno.env.get("ESKIZ_EMAIL");
  const password = Deno.env.get("ESKIZ_PASSWORD");
  if (!email || !password) throw new Error("eskiz_not_configured");

  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  const response = await fetch(`${ESKIZ_API}/auth/login`, { method: "POST", body: form });
  const json = await response.json().catch(() => null);
  const token = json?.data?.token;
  if (!response.ok || typeof token !== "string")
    throw new Error(`eskiz_login_failed_${response.status}`);
  eskizToken = token;
  return token;
}

async function eskizSend(phone: string, text: string, retry = true): Promise<void> {
  const token = eskizToken ?? (await eskizLogin());
  const form = new FormData();
  form.set("mobile_phone", toEskizPhone(phone));
  form.set("message", text);
  form.set("from", Deno.env.get("ESKIZ_FROM") || "4546");

  const response = await fetch(`${ESKIZ_API}/message/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (response.status === 401 && retry) {
    eskizToken = null;
    return eskizSend(phone, text, false);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // Matn va telefon logga yozilmaydi — faqat holat kodi va qisqa javob
    throw new Error(`eskiz_send_failed_${response.status}: ${detail.slice(0, 200)}`);
  }
}

type SmsHookEvent = { user?: { phone?: unknown }; sms?: { otp?: unknown } };

function json(status: number, body: string): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, "{}");
  if (hookSecrets.length === 0) {
    console.error("SEND_SMS_HOOK_SECRET sozlanmagan");
    const error = hookError(500, "sms_hook_not_configured");
    return json(error.status, error.body);
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: SmsHookEvent | null = null;
  for (const secret of hookSecrets) {
    try {
      event = new Webhook(secret).verify(payload, headers) as SmsHookEvent;
      break;
    } catch {
      // keyingi kalitni sinab ko‘ramiz
    }
  }
  if (!event) {
    const error = hookError(401, "invalid_signature");
    return json(error.status, error.body);
  }

  const phone = toUzE164(event.user?.phone);
  if (!phone) {
    const error = hookError(400, "unsupported_phone");
    return json(error.status, error.body);
  }

  const text = buildSmsText(Deno.env.get("SMS_TEMPLATE"), event.sms?.otp);
  if (!text) {
    const error = hookError(400, "invalid_otp_payload");
    return json(error.status, error.body);
  }

  const { data: limit, error: limitError } = await supabase.rpc("register_sms_attempt", {
    p_phone: phone,
  });
  if (limitError) {
    console.error("SMS limitini tekshirib bo‘lmadi", limitError.code);
    const error = hookError(500, "sms_limit_unavailable");
    return json(error.status, error.body);
  }
  if (!limit?.allowed) {
    const reason = typeof limit?.reason === "string" ? limit.reason : "too_many_attempts";
    const error = hookError(reason === "unsupported_phone" ? 400 : 429, reason);
    return json(error.status, error.body);
  }

  try {
    await eskizSend(phone, text);
  } catch (cause) {
    console.error("SMS yuborilmadi", cause instanceof Error ? cause.message : "unknown");
    const error = hookError(502, "sms_send_failed");
    return json(error.status, error.body);
  }

  return json(200, "{}");
});
