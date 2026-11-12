import Link from "next/link";
import { CircleUserRound, LayoutDashboard, Store, Users } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import type { Membership } from "@/lib/auth/dal";
import { canManageStaff } from "@/lib/auth/permissions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";

export type OsSection = "overview" | "staff";

/**
 * Restoran paneli qobig‘i. Menyuda faqat shu rolga ochiq va haqiqatan ishlaydigan bo‘limlar
 * ko‘rinadi (keyingi bosqichlar tayyor bo‘lganda qo‘shiladi).
 */
export function OsShell({
  locale,
  dict,
  membership,
  current,
  title,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  membership: Membership;
  current: OsSection;
  title: string;
  children: React.ReactNode;
}) {
  const base = `/${locale}/os/${membership.restaurantId}`;
  const nav: DashboardNavItem[] = [
    { href: base, label: dict.os.overview, icon: LayoutDashboard, current: current === "overview" },
  ];
  if (canManageStaff(membership.role)) {
    nav.push({
      href: `${base}/staff`,
      label: dict.os.staff,
      icon: Users,
      current: current === "staff",
    });
  }
  nav.push({ href: `/${locale}/os`, label: dict.os.allRestaurants, icon: Store });

  return (
    <DashboardShell
      nav={nav}
      navLabel={dict.os.navLabel}
      title={title}
      context={pickLocalized(membership.name, locale)}
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
      {children}
    </DashboardShell>
  );
}
