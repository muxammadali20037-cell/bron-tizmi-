/**
 * Supabase sxemasidan avtomatik yaratiladigan turlar.
 * Qo‘lda tahrirlanmaydi: `npm run db:types` bilan qayta yaratiladi.
 * Hozircha bazada OneTable jadvallari yo‘q (Sprint 2'da qo‘shiladi).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
