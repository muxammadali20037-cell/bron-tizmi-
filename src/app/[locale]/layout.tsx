import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import { brand } from "@/config/brand";
import { locales } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: {
      default: interpolate(dict.meta.title, { brand: brand.name }),
      template: `%s · ${brand.name}`,
    },
    description: dict.meta.description,
    applicationName: brand.name,
  };
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
