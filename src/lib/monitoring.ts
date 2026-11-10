import type * as Sentry from "@sentry/nextjs";

type SentryInitOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;

/**
 * Sentry'ga yuboriladigan ma'lumot cheklovi. Mijozlarning telefon raqami, cookie'lari va
 * so‘rov tanalari (bron formasi) xato hisobotlariga tushmaydi.
 */
export const sentryPrivacyOptions = {
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
} satisfies Partial<SentryInitOptions>;
