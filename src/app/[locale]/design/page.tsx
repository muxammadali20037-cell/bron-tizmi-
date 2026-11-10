import {
  CalendarCheck,
  CalendarDays,
  Image as ImageIcon,
  LayoutDashboard,
  SearchX,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KpiStat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data";
import { Alert, EmptyState, LoadingRegion, Skeleton, Spinner } from "@/components/ui/feedback";
import { ReservationStatusChip, TableStatusChip } from "@/components/ui/status-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logoVariants } from "@/config/brand";
import { generateSlotStarts } from "@/lib/booking/slots";
import { reservationStatuses, tableStatuses } from "@/lib/booking/statuses";
import { isDesignPageEnabled } from "@/lib/env";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { BookingDemo, FormDemo, LoadingButtonDemo, OverlayDemo } from "./demos";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const swatches = [
  {
    name: "Deep Forest",
    hex: "#0F3D34",
    role: "Asosiy tugma, sarlavha",
    contrast: "Ivory ustida 11.28:1",
    className: "bg-forest",
  },
  {
    name: "Charcoal",
    hex: "#1F2937",
    role: "Asosiy matn",
    contrast: "Ivory ustida 13.7:1",
    className: "bg-charcoal",
  },
  { name: "Warm Ivory", hex: "#F8F7F4", role: "Ilova foni", contrast: "—", className: "bg-ivory" },
  {
    name: "Muted Gold",
    hex: "#D4AF7C",
    role: "Faqat aksent",
    contrast: "Forest ustida 5.88:1; Ivory ustida matn emas",
    className: "bg-gold",
  },
  {
    name: "Sage",
    hex: "#587B70",
    role: "«Bo‘sh» holati",
    contrast: "Oq matn 4.69:1",
    className: "bg-sage",
  },
  {
    name: "Sage matn",
    hex: "#4A6A60",
    role: "Sage rangli kichik matn",
    contrast: "Ivory ustida 5.57:1",
    className: "bg-sage-text",
  },
  {
    name: "Ikkinchi matn",
    hex: "#5C6370",
    role: "Izoh, metadata",
    contrast: "Ivory ustida 5.64:1",
    className: "bg-muted-foreground",
  },
  {
    name: "Xato",
    hex: "#B3403F",
    role: "Xato, bekor qilish",
    contrast: "Ivory ustida 5.27:1",
    className: "bg-destructive",
  },
] as const;

const logoNames = {
  ring: "A · Halqa",
  dots: "B · Ikki o‘rin",
  sofra: "C · Sofra",
} as const;

/** Namuna slotlar: 12:00–23:00, har 30 daqiqa; uchtasi "band" ko‘rinishi uchun. */
const sampleSlots = generateSlotStarts({
  opensAt: "12:00",
  closesAt: "23:00",
  intervalMinutes: 30,
  lastSeatingBeforeCloseMinutes: 60,
}).map((minutes) => ({ minutes, available: ![780, 1170, 1200].includes(minutes) }));

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t py-10 first:border-t-0">
      <h2 id={id} className="font-display text-2xl font-semibold">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function DesignPage() {
  if (!isDesignPageEnabled()) notFound();

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  const dashboardNav = [
    { href: "#dashboard", label: "Umumiy", icon: LayoutDashboard, current: true },
    { href: "#dashboard", label: "Bronlar", icon: CalendarCheck },
    { href: "#dashboard", label: "Kalendar", icon: CalendarDays },
    { href: "#dashboard", label: "Zallar va stollar", icon: UtensilsCrossed },
    { href: "#dashboard", label: "Media", icon: ImageIcon },
    { href: "#dashboard", label: "Xodimlar", icon: Users },
    { href: "#dashboard", label: "Sozlamalar", icon: Settings },
  ];

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 sm:px-8">
        <div className="py-8">
          <Badge tone="warning">Ichki sahifa</Badge>
          <h1 className="font-display mt-4 text-4xl font-semibold">SOFRIVA design system</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Komponentlar namunasi. Bu yerdagi matn va raqamlar haqiqiy ma’lumot emas; sahifa qidiruv
            tizimlariga ko‘rsatilmaydi va ishga tushirishdan oldin o‘chiriladi. Holat yorliqlari
            tanlangan tilda (yuqoridagi til tanlagich).
          </p>
        </div>

        <Section
          id="logo"
          title="Logotip: 3 variant"
          description="Hammasi noldan chizilgan S monogramma. Bittasini tanlang — qolgan ikkitasi o‘chiriladi."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {logoVariants.map((variant) => (
              <Card key={variant} className="overflow-hidden">
                <div className="bg-ivory flex h-36 items-center justify-center border-b">
                  <Logo
                    variant={variant}
                    className="[&_svg]:size-12 [&>span:last-child]:text-2xl"
                  />
                </div>
                <div className="bg-forest flex h-24 items-center justify-center gap-6">
                  <Logo variant={variant} tone="dark" />
                </div>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{logoNames[variant]}</p>
                  <div className="flex items-end gap-3" aria-hidden="true">
                    <span className="bg-forest flex size-10 items-center justify-center rounded-[10px]">
                      <LogoMark variant={variant} tone="dark" className="size-7" />
                    </span>
                    <LogoMark variant={variant} className="size-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="colors"
          title="Ranglar"
          description="Kontrast WCAG formulasi bilan hisoblangan; oddiy matn uchun 4.5:1 kerak."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map((swatch) => (
              <div key={swatch.hex} className="bg-card overflow-hidden rounded-xl border">
                <div className={`h-16 border-b ${swatch.className}`} />
                <div className="p-4">
                  <p className="font-semibold">{swatch.name}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">{swatch.hex}</p>
                  <p className="mt-2 text-sm">{swatch.role}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{swatch.contrast}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="type"
          title="Tipografika"
          description="Playfair Display faqat 24 px dan katta brend sarlavhalarida. Qolgan hamma joyda Inter."
        >
          <div className="flex flex-col gap-4">
            <p className="font-display text-5xl font-semibold">Every Table. Better Connected.</p>
            <p className="font-display text-3xl font-semibold">
              Ваш столик ждёт · Stolingiz tayyor
            </p>
            <p className="text-xl font-semibold">
              Inter 20 — bo‘lim sarlavhasi, o‘zbek: o‘, g‘, sh, ch
            </p>
            <p className="max-w-2xl leading-relaxed">
              Inter 16 — asosiy matn. Mehmon sana, vaqt va kishi sonini tanlaydi, keyin zal va
              stolni tanlaydi. Кириллица тоже поддерживается.
            </p>
            <p className="text-muted-foreground text-sm">Inter 14 — izoh va metadata</p>
            <p className="text-2xl font-semibold tabular-nums">19:30 · 12 · 1 250 000</p>
          </div>
        </Section>

        <Section id="buttons" title="Tugmalar">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Stolni bron qilish</Button>
              <Button variant="secondary">Menyuni ko‘rish</Button>
              <Button variant="soft">Filtrlar</Button>
              <Button variant="ghost">Orqaga</Button>
              <Button variant="danger">O‘chirish</Button>
              <Button variant="danger-ghost">Bronni bekor qilish</Button>
              <Button variant="link">Batafsil</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Kichik</Button>
              <Button>O‘rta</Button>
              <Button size="lg">Katta</Button>
              <Button disabled>O‘chiq</Button>
              <LoadingButtonDemo label="Bosing: yuklanish" />
            </div>
          </div>
        </Section>

        <Section
          id="forms"
          title="Forma"
          description="Telefon maydoni +998 bilan; xato «Saqlash» bosilganda ko‘rinadi va ekran o‘quvchi uni maydon bilan birga o‘qiydi."
        >
          <FormDemo
            labels={{
              phone: dict.phone,
              optional: dict.common.optional,
              save: dict.common.save,
            }}
          />
        </Section>

        <Section
          id="statuses"
          title="Holatlar"
          description="Rang, belgi va so‘z birga — faqat rangga tayanilmaydi."
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-3 text-sm font-semibold">Bron holatlari</p>
              <div className="flex flex-wrap gap-2">
                {reservationStatuses.map((status) => (
                  <ReservationStatusChip
                    key={status}
                    status={status}
                    label={dict.reservationStatus[status]}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Stol holatlari</p>
              <div className="flex flex-wrap gap-2">
                {tableStatuses.map((status) => (
                  <TableStatusChip key={status} status={status} label={dict.tableStatus[status]} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="booking"
          title="Bron elementlari"
          description="Slotlar va mehmonlar soni. Haqiqiy bo‘sh vaqtlar Sprint 7'dan bazadan keladi."
        >
          <Card className="max-w-xl">
            <CardContent>
              <BookingDemo
                locale={locale}
                slots={sampleSlots}
                labels={{ slots: dict.slots, party: dict.party }}
              />
            </CardContent>
          </Card>
        </Section>

        <Section id="feedback" title="Xabarlar va holatlar">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Alert tone="info" title="Ma’lumot">
                Restoran bronni 15 daqiqa ichida tasdiqlaydi.
              </Alert>
              <Alert tone="success" title="Bron tasdiqlandi" />
              <Alert tone="warning" title="Tasdiq kutilmoqda" />
              <Alert
                tone="danger"
                title={dict.states.errorTitle}
                action={
                  <Button size="sm" variant="secondary">
                    {dict.common.retry}
                  </Button>
                }
              >
                {dict.states.errorDescription}
              </Alert>
            </div>
            <div className="flex flex-col gap-4">
              <EmptyState
                icon={SearchX}
                title={dict.states.emptyTitle}
                description="Filtrlarni kamaytirib yoki boshqa sanani tanlab ko‘ring."
              />
              <LoadingRegion
                label={dict.common.loading}
                className="bg-card flex gap-4 rounded-xl border p-4"
              >
                <Skeleton className="size-20 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </LoadingRegion>
              <Spinner label={dict.common.loading} />
            </div>
          </div>
        </Section>

        <Section id="overlays" title="Oynalar va xabarnomalar">
          <OverlayDemo
            labels={{
              close: dict.common.close,
              cancel: dict.common.cancel,
              confirm: dict.common.confirm,
            }}
          />
        </Section>

        <Section id="tabs" title="Yorliqlar">
          <Tabs defaultValue="today" className="max-w-xl">
            <TabsList>
              <TabsTrigger value="today">Bugun</TabsTrigger>
              <TabsTrigger value="upcoming">Kelgusi</TabsTrigger>
              <TabsTrigger value="past">O‘tgan</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <Card>
                <CardHeader>
                  <CardTitle>Bugun</CardTitle>
                  <CardDescription>Yorliqlar o‘q tugmalari bilan almashadi.</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </TabsContent>
            <TabsContent value="upcoming">
              <p className="text-muted-foreground text-sm">Kelgusi bronlar.</p>
            </TabsContent>
            <TabsContent value="past">
              <p className="text-muted-foreground text-sm">O‘tgan bronlar.</p>
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          id="dashboard"
          title="Restaurant OS qobig‘i"
          description="Namuna: menyu havolalari tegishli sprintlarda ulanadi. Ko‘rsatkich kartalari ma’lumot bo‘lmasa raqam o‘ylab topmaydi."
        >
          <div inert className="h-[34rem] overflow-hidden rounded-2xl border">
            <DashboardShell
              preview
              nav={dashboardNav}
              navLabel="Restoran menyusi"
              context="Namuna restoran · Asosiy filial"
              title="Bugun"
              actions={<Button size="sm">Yangi bron</Button>}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiStat
                  label="Bugungi bronlar"
                  value={null}
                  icon={CalendarCheck}
                  emptyLabel="Ma’lumot hali yo‘q"
                />
                <KpiStat
                  label="Kelgan mehmonlar"
                  value={null}
                  icon={Users}
                  emptyLabel="Ma’lumot hali yo‘q"
                />
                <KpiStat
                  label="Kelmadi"
                  value={null}
                  icon={CalendarDays}
                  emptyLabel="Ma’lumot hali yo‘q"
                />
              </div>
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vaqt</TableHead>
                      <TableHead>Mehmon</TableHead>
                      <TableHead>Kishi</TableHead>
                      <TableHead>Stol</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="tabular-nums">19:00</TableCell>
                      <TableCell>Namuna mehmon</TableCell>
                      <TableCell className="tabular-nums">4</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>
                        <ReservationStatusChip
                          status="confirmed"
                          label={dict.reservationStatus.confirmed}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="tabular-nums">19:30</TableCell>
                      <TableCell>Namuna mehmon</TableCell>
                      <TableCell className="tabular-nums">2</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell>
                        <ReservationStatusChip
                          status="pending"
                          label={dict.reservationStatus.pending}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </DashboardShell>
          </div>
        </Section>
      </main>
    </>
  );
}
