import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * "Ruxsat yo‘q" holati. Restoran mavjudligini oshkor qilmaslik uchun matn har doim bir xil:
 * restoran yo‘q bo‘lsa ham, siz a’zo bo‘lmasangiz ham.
 */
export function Forbidden({
  title,
  description,
  backLabel,
  backHref,
}: {
  title: string;
  description: string;
  backLabel: string;
  backHref: string;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center"
    >
      <span className="bg-secondary text-primary inline-flex size-14 items-center justify-center rounded-full">
        <ShieldAlert aria-hidden="true" className="size-7" />
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      <Link href={backHref} className={buttonVariants({ size: "lg" })}>
        {backLabel}
      </Link>
    </main>
  );
}
