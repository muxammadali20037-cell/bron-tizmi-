import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Har sahifa so‘rovida Supabase sessiyasini yangilaydi: muddati tugayotgan kirish tokeni
 * almashtiriladi va yangi cookie ham sahifaga (request), ham brauzerga (response) beriladi.
 * `getClaims()` token imzosini tekshiradi — soxta cookie bilan "kirgan" bo‘lib bo‘lmaydi.
 *
 * Bu faqat tezkor yo‘naltirish uchun. Haqiqiy ruxsat tekshiruvi sahifa va Server Action
 * ichida (src/lib/auth/dal.ts) va bazadagi RLS'da.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isSignedIn: boolean }> {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return { response, isSignedIn: false };

  const env = getPublicEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // createServerClient va getClaims orasiga hech narsa qo‘yilmaydi (Supabase tavsiyasi)
  const { data } = await supabase.auth.getClaims();
  return { response, isSignedIn: Boolean(data?.claims?.sub) };
}
