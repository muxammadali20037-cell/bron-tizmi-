import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ko‘rsatkich kartasi. Faqat bazadan hisoblangan haqiqiy qiymat bilan ishlatiladi;
 * ma’lumot hali yo‘q bo‘lsa, `value` o‘rniga `emptyLabel` ko‘rsatiladi (soxta raqam yo‘q).
 */
export function KpiStat({
  label,
  value,
  hint,
  icon: Icon,
  emptyLabel,
  className,
}: {
  label: string;
  value: string | number | null;
  hint?: string;
  icon?: LucideIcon;
  emptyLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-card shadow-card flex flex-col gap-3 rounded-xl border p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon ? (
          <span className="bg-secondary text-primary inline-flex size-9 items-center justify-center rounded-lg">
            <Icon aria-hidden="true" className="size-[1.125rem]" />
          </span>
        ) : null}
      </div>
      {value === null ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

/** Jadval: tor ekranda gorizontal suriladi, sarlavha qatori ajralib turadi. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="bg-card w-full overflow-x-auto rounded-xl border">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead className="bg-muted/60 [&_tr]:border-b" {...props} />;
}

export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody className="[&_tr:last-child]:border-0" {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("hover:bg-muted/40 border-b transition-colors", className)} {...props} />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "text-muted-foreground h-11 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption className={cn("text-muted-foreground mt-3 text-sm", className)} {...props} />;
}
