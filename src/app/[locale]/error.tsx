"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import boundary from "@/messages/boundary.json";

/**
 * Sahifada kutilmagan xato bo‘lsa ko‘rinadi. Xato tafsiloti foydalanuvchiga ko‘rsatilmaydi
 * (server xatolari bu yerga umumiy matn bilan keladi); u Sentry va server logida qoladi.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const copy = boundary[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center"
    >
      <h1 className="text-xl font-semibold">{copy.title}</h1>
      <p className="text-muted-foreground leading-relaxed">{copy.description}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => retry()}>
          <RefreshCw aria-hidden="true" />
          {copy.retry}
        </Button>
        <Link href={`/${locale}`} className={buttonVariants({ variant: "secondary" })}>
          {copy.home}
        </Link>
      </div>
    </main>
  );
}
