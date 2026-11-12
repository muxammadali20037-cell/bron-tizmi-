import Link from "next/link";
import { CircleUserRound, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/dal";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Sarlavhadagi "Kirish" yoki "Profil" havolasi. Sessiyani o‘qiydi, shuning uchun
 * sahifada <Suspense> ichida ishlatiladi — sahifaning qolgan qismi kutmaydi.
 */
export async function AccountNav({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { signIn: string; profile: string };
}) {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <Link
        href={`/${locale}/login`}
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        <LogIn aria-hidden="true" />
        {labels.signIn}
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/profile`}
      className={cn(buttonVariants({ variant: "soft", size: "sm" }), "max-w-48")}
    >
      <CircleUserRound aria-hidden="true" />
      <span className="truncate">{viewer.fullName || labels.profile}</span>
    </Link>
  );
}

/** Sessiya o‘qilguncha joy egallab turadi (tugma o‘lchami sakramasligi uchun). */
export function AccountNavFallback() {
  return <span aria-hidden="true" className="bg-muted inline-block h-9 w-24 rounded-lg" />;
}
