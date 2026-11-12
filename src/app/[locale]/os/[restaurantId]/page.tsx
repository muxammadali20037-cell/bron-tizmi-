import type { Metadata } from "next";
import { Armchair, Building2, DoorOpen, Users } from "lucide-react";
import { Forbidden } from "@/components/shared/forbidden";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { KpiStat } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { requireRestaurantAccess } from "@/lib/auth/dal";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";
import { OsShell } from "./os-shell";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.os.metaTitle, robots: { index: false } };
}

const statusTone: Record<Enums<"restaurant_status">, BadgeTone> = {
  draft: "neutral",
  pending_review: "warning",
  published: "success",
  rejected: "danger",
  suspended: "danger",
};

/** Restoran paneli: umumiy ko‘rinish. Raqamlar faqat bazadan (RLS orqali, shu restoran bo‘yicha). */
export default async function OsOverviewPage({ params }: PageProps<"/[locale]/os/[restaurantId]">) {
  const [dict, locale, { restaurantId }] = await Promise.all([
    getDictionary(),
    getLocale(),
    params,
  ]);
  const { membership } = await requireRestaurantAccess(
    locale,
    restaurantId,
    `/${locale}/os/${restaurantId}`,
  );

  if (!membership) {
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
  const countOf = async (
    table: "restaurant_branches" | "restaurant_halls" | "restaurant_tables" | "staff_members",
  ) => {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);
    if (error) throw new Error(`${table} sonini o‘qib bo‘lmadi`, { cause: error });
    return count ?? 0;
  };

  const [branches, halls, tables, team] = await Promise.all([
    countOf("restaurant_branches"),
    countOf("restaurant_halls"),
    countOf("restaurant_tables"),
    countOf("staff_members"),
  ]);

  const { os } = dict;
  const valueOrEmpty = (value: number) => (value > 0 ? value : null);

  return (
    <OsShell
      locale={locale}
      dict={dict}
      membership={membership}
      current="overview"
      title={os.overviewTitle}
    >
      <div className="flex flex-col gap-6">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground text-sm">{os.yourRole}:</dt>
            <dd>
              <Badge tone="gold">{dict.roles[membership.role]}</Badge>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground text-sm">{os.status}:</dt>
            <dd>
              <Badge tone={statusTone[membership.status]}>
                {dict.restaurantStatus[membership.status]}
              </Badge>
            </dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiStat
            label={os.branches}
            value={valueOrEmpty(branches)}
            icon={Building2}
            emptyLabel={os.notYet}
          />
          <KpiStat
            label={os.halls}
            value={valueOrEmpty(halls)}
            icon={DoorOpen}
            emptyLabel={os.notYet}
          />
          <KpiStat
            label={os.tables}
            value={valueOrEmpty(tables)}
            icon={Armchair}
            emptyLabel={os.notYet}
          />
          <KpiStat label={os.teamMembers} value={team} icon={Users} emptyLabel={os.notYet} />
        </div>

        <Alert tone="info" title={os.nextStepsTitle}>
          {os.nextSteps}
        </Alert>
      </div>
    </OsShell>
  );
}
