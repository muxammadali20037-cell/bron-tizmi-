import { z } from "zod";

/**
 * Brauzerga ham chiqadigan (NEXT_PUBLIC_) o‘zgaruvchilar.
 * Maxfiy kalitlar bu yerga hech qachon qo‘shilmaydi.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * O‘zgaruvchilar birinchi ishlatilganda tekshiriladi. Yetishmasa, aniq xabar bilan to‘xtaydi,
 * shunda xato jim o‘tib ketmaydi.
 */
export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    // Next.js NEXT_PUBLIC_ qiymatlarni faqat to‘g‘ridan-to‘g‘ri murojaatda brauzer kodiga joylaydi
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Muhit o‘zgaruvchilari noto‘g‘ri yoki yo‘q: ${missing}. .env.example'ga qarang.`,
    );
  }

  return result.data;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Ichki /design sahifasi (komponentlar namunasi). Lokal ishlab chiqishda doim ochiq,
 * serverda faqat ENABLE_DESIGN_PAGE=true bo‘lsa. Haqiqiy ishga tushirishdan oldin o‘chiriladi.
 */
export function isDesignPageEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DESIGN_PAGE === "true";
}
