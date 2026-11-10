import { cn } from "@/lib/utils";

/** Vaqtinchalik so‘z-belgi (wordmark). Rasmiy logotip tayyor bo‘lganda almashtiriladi. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <circle cx="12" cy="12" r="10" fill="var(--brand-navy)" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="var(--brand-gold)" strokeWidth="2" />
      </svg>
      <span className="text-navy text-lg">OneTable</span>
    </span>
  );
}
