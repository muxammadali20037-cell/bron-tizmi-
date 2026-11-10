import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  current?: boolean;
};

/**
 * Restaurant OS va Super Admin qobig‘i: chapda menyu (kompyuter/planshet),
 * tor ekranda esa yuqorida gorizontal suriladigan menyu. Holatsiz — server komponent.
 */
export function DashboardShell({
  nav,
  navLabel,
  title,
  context,
  actions,
  children,
  className,
  preview = false,
}: {
  nav: DashboardNavItem[];
  /** Menyu nomi ekran o‘quvchi uchun, masalan "Restoran menyusi". */
  navLabel: string;
  title: string;
  /** Sarlavha ustidagi kichik matn: restoran yoki filial nomi. */
  context?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Boshqa sahifa ichida namuna sifatida: h2 sarlavha, <main> o‘rniga <div>. */
  preview?: boolean;
}) {
  const Heading = preview ? "h2" : "h1";
  const Main = preview ? "div" : "main";
  return (
    <div className={cn("bg-background flex min-h-full w-full", className)}>
      <aside className="bg-forest text-ivory hidden w-64 shrink-0 flex-col gap-8 px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo tone="dark" />
        </div>
        <nav aria-label={navLabel}>
          <ul className="flex flex-col gap-1">
            {nav.map(({ href, label, icon: Icon, current }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    current
                      ? "bg-ivory/12 text-ivory"
                      : "text-ivory/75 hover:bg-ivory/8 hover:text-ivory",
                  )}
                >
                  <Icon aria-hidden="true" className={cn("size-5", current && "text-gold")} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              {context ? <p className="text-muted-foreground truncate text-sm">{context}</p> : null}
              <Heading className="truncate text-xl font-semibold">{title}</Heading>
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
          <nav aria-label={navLabel} className="overflow-x-auto px-3 pb-2 lg:hidden">
            <ul className="flex gap-1">
              {nav.map(({ href, label, icon: Icon, current }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap",
                      current
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <Main id={preview ? undefined : "main"} className="flex-1 px-5 py-6 sm:px-8">
          {children}
        </Main>
      </div>
    </div>
  );
}
