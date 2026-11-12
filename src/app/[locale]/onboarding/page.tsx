import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { getViewer } from "@/lib/auth/dal";
import { loginPath, safeNextPath } from "@/lib/auth/next-path";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { OnboardingForm } from "./onboarding-form";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.onboarding.metaTitle, robots: { index: false } };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/[locale]/onboarding">) {
  const [dict, locale, params] = await Promise.all([getDictionary(), getLocale(), searchParams]);
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, locale);

  const viewer = await getViewer();
  if (!viewer) redirect(loginPath(locale, `/${locale}/onboarding`));
  if (viewer.onboarded) redirect(next);

  const { onboarding } = dict;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main id="main" className="flex flex-1 items-start justify-center px-5 py-10 sm:py-16">
        <div className="bg-card shadow-card w-full max-w-md rounded-2xl border p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold">{onboarding.title}</h1>
          <p className="text-muted-foreground mt-2 mb-6 leading-relaxed">{onboarding.subtitle}</p>
          <OnboardingForm
            locale={locale}
            next={next}
            defaultName={viewer.fullName ?? ""}
            texts={{
              nameLabel: onboarding.nameLabel,
              nameHint: onboarding.nameHint,
              nameError: onboarding.nameError,
              languageLabel: onboarding.languageLabel,
              consentBefore: onboarding.consentBefore,
              consentLink: onboarding.consentLink,
              consentAfter: onboarding.consentAfter,
              consentError: onboarding.consentError,
              submit: onboarding.submit,
              errors: dict.appErrors,
            }}
          />
        </div>
      </main>
    </>
  );
}
