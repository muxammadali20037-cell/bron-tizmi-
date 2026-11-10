/**
 * Server xatolarini Sentry'ga yuborish. SENTRY_DSN berilmagan bo‘lsa hech narsa qilmaydi.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    const { sentryPrivacyOptions } = await import("@/lib/monitoring");
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? "development",
      ...sentryPrivacyOptions,
    });
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
