import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server Components, Server Actions va Route Handlerlar uchun Supabase klienti.
 * Foydalanuvchi sessiyasi cookie orqali o‘qiladi, shuning uchun RLS shu foydalanuvchi nomidan ishlaydi.
 */
export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component ichida cookie yozib bo‘lmaydi — sessiyani proxy yangilaydi.
          }
        },
      },
    },
  );
}
