import { brand, type LogoVariant } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * SOFRIVA logotipi (ADR 0003). Hamma shakllar noldan chizilgan: S harfi ikki teng yoydan
 * quriladi (markazlari 32;23 va 32;41, radiusi 9). Boshqa brendlarning belgilaridan nusxa yo‘q.
 *
 * Variantlar:
 *  - ring  — S va uning atrofida oltin halqa (dasturxon chegarasi).
 *  - dots  — S, ikki uchida oltin nuqta (stol atrofidagi ikki o‘rin).
 *  - sofra — Deep Forest dumaloq stol ichida S va atrofida sakkiz o‘rin.
 */

const S_PATH = "M38.89 17.21A9 9 0 1 0 32 32A9 9 0 1 1 25.11 46.79";

const SEAT_POINTS = [
  [58, 32],
  [50.38, 50.38],
  [32, 58],
  [13.62, 50.38],
  [6, 32],
  [13.62, 13.62],
  [32, 6],
  [50.38, 13.62],
] as const;

type Tone = "light" | "dark";

type MarkProps = {
  variant?: LogoVariant;
  /** "light" — och fonda, "dark" — Deep Forest fonda. */
  tone?: Tone;
  className?: string;
};

export function LogoMark({ variant = brand.logoVariant, tone = "light", className }: MarkProps) {
  const ink = tone === "light" ? "var(--brand-forest)" : "var(--brand-ivory)";
  const paper = tone === "light" ? "var(--brand-ivory)" : "var(--brand-forest)";

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      {variant === "ring" && (
        <>
          <circle cx="32" cy="32" r="27" fill="none" stroke="var(--brand-gold)" strokeWidth="2.5" />
          <path d={S_PATH} fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {variant === "dots" && (
        <>
          <path d={S_PATH} fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
          <circle cx="38.89" cy="17.21" r="4.6" fill="var(--brand-gold)" />
          <circle cx="25.11" cy="46.79" r="4.6" fill="var(--brand-gold)" />
        </>
      )}
      {variant === "sofra" && (
        <>
          <circle cx="32" cy="32" r="19" fill={ink} />
          <g transform="translate(32 32) scale(0.6) translate(-32 -32)">
            <path d={S_PATH} fill="none" stroke={paper} strokeWidth="6.5" strokeLinecap="round" />
          </g>
          {SEAT_POINTS.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="var(--brand-gold)" />
          ))}
        </>
      )}
    </svg>
  );
}

type LogoProps = MarkProps & {
  /** Faqat belgini ko‘rsatish (masalan, tor mobil sarlavhada). */
  markOnly?: boolean;
};

/** Belgi + so‘z-belgi. So‘z-belgi Playfair Display, bosh harflar, keng oraliq. */
export function Logo({ variant, tone = "light", markOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        tone === "light" ? "text-forest" : "text-ivory",
        className,
      )}
    >
      <LogoMark variant={variant} tone={tone} />
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
