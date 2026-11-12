import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { Alert } from "@/components/ui/feedback";
import { getViewer } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/next-path";
import { isSupabaseConfigured } from "@/lib/env";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { LoginForm } from "./login-form";

// Sessiyaga bog‘liq sahifa: server javobni kutadi (kirgan bo‘lsa darhol yo‘naltiradi)
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.login.metaTitle, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const [dict, locale, params] = await Promise.all([getDictionary(), getLocale(), searchParams]);
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, locale);

  const viewer = await getViewer();
  if (viewer) {
    redirect(viewer.onboarded ? next : `/${locale}/onboarding?next=${encodeURIComponent(next)}`);
  }

  const { login, phone, authErrors } = dict;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main id="main" className="flex flex-1 items-start justify-center px-5 py-10 sm:py-16">
        <div className="bg-card shadow-card w-full max-w-md rounded-2xl border p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold">{login.title}</h1>
          <p className="text-muted-foreground mt-2 mb-6 leading-relaxed">{login.subtitle}</p>
          {isSupabaseConfigured() ? (
            <LoginForm
              locale={locale}
              next={next}
              texts={{
                sendCode: login.sendCode,
                codeTitle: login.codeTitle,
                codeSentTo: login.codeSentTo,
                codeLabel: login.codeLabel,
                codeRequired: login.codeRequired,
                verify: login.verify,
                resendIn: login.resendIn,
                resend: login.resend,
                changePhone: login.changePhone,
                phoneLabel: phone.label,
                phoneHint: phone.hint,
                countryCode: phone.countryCode,
                phoneRequired: phone.errors.required,
                phoneInvalid: phone.errors.invalid,
                errors: authErrors,
              }}
            />
          ) : (
            <Alert tone="warning" title={login.notConfigured} />
          )}
        </div>
      </main>
    </>
  );
}
