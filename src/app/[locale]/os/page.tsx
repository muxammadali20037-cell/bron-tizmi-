import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import { SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { formatDate, interpolate } from "@/lib/i18n/format";
import { pickLocalized } from "@/lib/i18n/localized";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InvitationCard } from "./invitation-card";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.os.metaTitle, robots: { index: false } };
}

/** Restoran paneliga kirish: a’zo bo‘lgan restoranlar va kelgan takliflar. */
export default async function OsIndexPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const viewer = await requireViewer(locale, `/${locale}/os`);

  const supabase = await createSupabaseServerClient();
  const { data: invitations, error } = await supabase.rpc("my_staff_invitations");
  if (error) throw new Error("Takliflarni o‘qib bo‘lmadi", { cause: error });

  // Bitta restoran va yangi taklif yo‘q bo‘lsa — to‘g‘ridan-to‘g‘ri uning paneliga
  const [onlyMembership] = viewer.memberships;
  if (viewer.memberships.length === 1 && invitations.length === 0 && onlyMembership) {
    redirect(`/${locale}/os/${onlyMembership.restaurantId}`);
  }

  const { os } = dict;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12"
      >
        <div>
          <h1 className="font-display text-4xl font-semibold">{os.chooseTitle}</h1>
          {viewer.memberships.length > 0 ? (
            <p className="text-muted-foreground mt-2">{os.chooseSubtitle}</p>
          ) : null}
        </div>

        {invitations.length > 0 ? (
          <section aria-labelledby="invitations-title" className="flex flex-col gap-3">
            <h2 id="invitations-title" className="text-lg font-semibold">
              {os.invitationsTitle}
            </h2>
            <ul className="flex flex-col gap-3">
              {invitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitationId={invitation.id}
                  locale={locale}
                  text={interpolate(os.invitationText, {
                    restaurant: pickLocalized(invitation.restaurant_name, locale),
                    role: dict.roles[invitation.role],
                  })}
                  expires={interpolate(os.invitationExpires, {
                    date: formatDate(invitation.expires_at, locale),
                  })}
                  texts={{ accept: os.accept, decline: os.decline, errors: dict.appErrors }}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {viewer.memberships.length === 0 ? (
          invitations.length === 0 ? (
            <EmptyState icon={Store} title={os.emptyTitle} description={os.emptyDescription} />
          ) : null
        ) : (
          <ul className="flex flex-col gap-3">
            {viewer.memberships.map((membership) => (
              <li key={membership.restaurantId}>
                <Link
                  href={`/${locale}/os/${membership.restaurantId}`}
                  className="bg-card shadow-card hover:border-primary/40 flex items-center gap-4 rounded-xl border p-5 transition-colors"
                >
                  <span className="bg-secondary text-primary inline-flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <Store aria-hidden="true" className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">
                      {pickLocalized(membership.name, locale)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {dict.roles[membership.role]} · {dict.restaurantStatus[membership.status]}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
                  <span className="sr-only">{os.open}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
