import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail, ShieldCheck, Store } from "lucide-react";
import { SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { plural } from "@/lib/i18n/format";
import { pickLocalized } from "@/lib/i18n/localized";
import { formatE164ForDisplay } from "@/lib/phone";
import { signOutAction } from "../login/actions";
import { ProfileForm } from "./profile-form";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.profile.metaTitle, robots: { index: false } };
}

export default async function ProfilePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const viewer = await requireViewer(locale, `/${locale}/profile`);
  const { profile, onboarding } = dict;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12"
      >
        <h1 className="font-display text-4xl font-semibold">{profile.title}</h1>

        {viewer.pendingInvitations > 0 ? (
          <Alert
            tone="info"
            title={plural(locale, viewer.pendingInvitations, profile.invitations)}
            action={
              <Link href={`/${locale}/os`} className={buttonVariants({ size: "sm" })}>
                <Mail aria-hidden="true" />
                {profile.viewInvitations}
              </Link>
            }
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle as="h2">{profile.detailsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium">{profile.phoneLabel}</p>
              <p className="mt-1 text-lg tabular-nums">
                {viewer.phone ? formatE164ForDisplay(viewer.phone) : "—"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{profile.phoneNote}</p>
            </div>
            <ProfileForm
              locale={locale}
              defaults={{ fullName: viewer.fullName ?? "", locale: viewer.locale }}
              texts={{
                nameLabel: onboarding.nameLabel,
                nameError: onboarding.nameError,
                languageLabel: onboarding.languageLabel,
                save: dict.common.save,
                saved: profile.saved,
                error: dict.appErrors.generic,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle as="h2">{profile.workplacesTitle}</CardTitle>
            {viewer.memberships.length > 0 ? (
              <Link
                href={`/${locale}/os`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {dict.account.restaurantPanel}
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {viewer.memberships.length === 0 ? (
              <p className="text-muted-foreground">{profile.workplacesEmpty}</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {viewer.memberships.map((membership) => (
                  <li key={membership.restaurantId}>
                    <Link
                      href={`/${locale}/os/${membership.restaurantId}`}
                      className="hover:bg-muted -mx-2 flex items-center gap-3 rounded-lg px-2 py-3"
                    >
                      <span className="bg-secondary text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-lg">
                        <Store aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {pickLocalized(membership.name, locale)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {dict.roles[membership.role]} · {dict.restaurantStatus[membership.status]}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
                      <span className="sr-only">{profile.openPanel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {viewer.isSuperAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="text-primary size-5" />
                {profile.adminTitle}
              </CardTitle>
              <CardDescription>{profile.adminDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "secondary" })}>
                {dict.account.adminPanel}
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle as="h2">{profile.signOutTitle}</CardTitle>
            <CardDescription>{profile.signOutDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="danger-ghost">
                {dict.account.signOut}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
