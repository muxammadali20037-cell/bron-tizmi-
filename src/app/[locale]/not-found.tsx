import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";

export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-5 py-20 text-center"
    >
      <Logo />
      <p className="font-display text-forest text-7xl font-semibold">404</p>
      <h1 className="text-xl font-semibold">{dict.notFound.title}</h1>
      <p className="text-muted-foreground leading-relaxed">{dict.notFound.description}</p>
      <Link href={`/${locale}`} className={buttonVariants({ size: "lg" })}>
        {dict.notFound.back}
      </Link>
    </main>
  );
}
