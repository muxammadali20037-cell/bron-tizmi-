import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { SOFRIVA_MARK_PATH } from "./logo-path";

type Tone = "light" | "dark";

type MarkProps = {
  /** "light" — och fonda (Deep Forest belgi), "dark" — Deep Forest fonda (oltin belgi). */
  tone?: Tone;
  className?: string;
};

/** SOFRIVA belgisi: egasi buyurtma qilib chizdirgan S monogramma (ADR 0003). */
export function LogoMark({ tone = "light", className }: MarkProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <path
        d={SOFRIVA_MARK_PATH}
        fillRule="evenodd"
        fill={tone === "light" ? "var(--brand-forest)" : "var(--brand-gold)"}
      />
    </svg>
  );
}

type LogoProps = MarkProps & {
  /** Faqat belgini ko‘rsatish (masalan, tor mobil sarlavhada). */
  markOnly?: boolean;
};

/** Belgi + so‘z-belgi. So‘z-belgi Playfair Display, bosh harflar, keng oraliq. */
export function Logo({ tone = "light", markOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        tone === "light" ? "text-forest" : "text-ivory",
        className,
      )}
    >
      <LogoMark tone={tone} />
      {markOnly ? (
        <span className="sr-only">{brand.name}</span>
      ) : (
        <span className="font-display text-xl leading-none font-semibold tracking-[0.14em]">
          {brand.name}
        </span>
      )}
    </span>
  );
}
