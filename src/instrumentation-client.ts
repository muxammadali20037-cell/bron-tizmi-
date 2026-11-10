/**
 * Brauzer xatolarini Sentry'ga yuborish. DSN yo‘q bo‘lsa Sentry kodi umuman yuklanmaydi,
 * shuning uchun sahifa og‘irlashmaydi.
 */
import { sentryPrivacyOptions } from "@/lib/monitoring";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      ...sentryPrivacyOptions,
    });
  });
}
