import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";

export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-20 text-center">
      <Logo />
      <p className="text-navy text-6xl font-semibold">404</p>
      <h1 className="text-xl font-semibold">{dict.notFound.title}</h1>
      <Link
        href={`/${locale}`}
        className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-lg px-5 font-medium transition-opacity hover:opacity-90"
      >
        {dict.notFound.back}
      </Link>
    </main>
  );
}
