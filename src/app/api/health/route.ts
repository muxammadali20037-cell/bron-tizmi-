import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Monitoring uchun: ilova ishlayaptimi va qaysi versiya deploy qilingan. */
export async function GET() {
  await connection();

  return Response.json(
    {
      status: "ok",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? "development",
      supabaseConfigured: isSupabaseConfigured(),
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
