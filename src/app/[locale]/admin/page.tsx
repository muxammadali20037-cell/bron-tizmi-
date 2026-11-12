import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CircleUserRound,
  Images,
  LayoutDashboard,
  Store,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Forbidden } from "@/components/shared/forbidden";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiStat } from "@/components/ui/data";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.metaTitle, robots: { index: false } };
}

const restaurantStatuses = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "suspended",
] as const;

const overviewSchema = z.object({
  users: z.number().int(),
  restaurants: z.partialRecord(z.enum(restaurantStatuses), z.number().int()),
  reservations_upcoming: z.number().int(),
  media_pending_review: z.number().int(),
});

/** Super Admin: platforma bo‘yicha haqiqiy raqamlar (bazadan, faqat admin uchun). */
export default async function AdminPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const admin = await requireSuperAdmin(locale, `/${locale}/admin`);

  if (!admin) {
    return (
      <Forbidden
        title={dict.forbidden.title}
        description={dict.forbidden.description}
        backLabel={dict.forbidden.back}
        backHref={`/${locale}/profile`}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw new Error("Admin ko‘rsatkichlarini o‘qib bo‘lmadi", { cause: error });
  const overview = overviewSchema.parse(data);

  const { admin: texts } = dict;
  const totalRestaurants = Object.values(overview.restaurants).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );
  const orEmpty = (value: number) => (value > 0 ? value : null);

  return (
    <DashboardShell
      nav={[
        { href: `/${locale}/admin`, label: texts.overview, icon: LayoutDashboard, current: true },
      ]}
      navLabel={texts.navLabel}
      title={texts.title}
      actions={
        <Link
          href={`/${locale}/profile`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label={dict.account.profile}
        >
          <CircleUserRound aria-hidden="true" />
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiStat
            label={texts.users}
            value={overview.users}
            icon={Users}
            emptyLabel={texts.none}
          />
          <KpiStat
            label={texts.restaurants}
            value={orEmpty(totalRestaurants)}
            icon={Store}
            emptyLabel={texts.none}
          />
          <KpiStat
            label={texts.upcomingReservations}
            value={orEmpty(overview.reservations_upcoming)}
            icon={CalendarCheck}
            emptyLabel={texts.none}
          />
          <KpiStat
            label={texts.mediaPending}
            value={orEmpty(overview.media_pending_review)}
            icon={Images}
            emptyLabel={texts.none}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{texts.restaurantsByStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRestaurants === 0 ? (
              <p className="text-muted-foreground">{texts.empty}</p>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-5">
                {restaurantStatuses.map((status) => (
                  <div key={status} className="bg-muted/50 rounded-lg p-3">
                    <dt className="text-muted-foreground text-sm">
                      {dict.restaurantStatus[status]}
                    </dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {overview.restaurants[status] ?? 0}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
