import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Yuklanish joyini egallab turuvchi kulrang blok. Ekran o‘quvchi uni o‘qimaydi. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

/** Yuklanayotgan hudud: ko‘rinadigan skeletlar + ekran o‘quvchi uchun matn. */
export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span role={label ? "status" : undefined} className={cn("inline-flex items-center", className)}>
      <LoaderCircle aria-hidden="true" className="text-primary size-5 animate-spin" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

type AlertTone = "info" | "success" | "warning" | "danger";

const alertLook: Record<AlertTone, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: "bg-secondary text-secondary-foreground border-primary/15" },
  success: {
    icon: CircleCheck,
    classes: "bg-success-soft text-success-soft-foreground border-success/25",
  },
  warning: {
    icon: TriangleAlert,
    classes: "bg-warning-soft text-warning-soft-foreground border-gold/50",
  },
  danger: {
    icon: CircleAlert,
    classes: "bg-destructive-soft text-destructive-soft-foreground border-destructive/25",
  },
};

/** Sahifa ichidagi xabar. Xato — `role="alert"` (darhol o‘qiladi), qolganlari — `status`. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, classes } = alertLook[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4", classes, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="leading-snug font-semibold">{title}</p>
        {children ? <div className="text-sm leading-relaxed opacity-90">{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/** Ma’lumot yo‘q holati: nima uchun bo‘sh va nima qilish mumkin. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <span className="bg-secondary text-primary inline-flex size-12 items-center justify-center rounded-full">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="text-base font-semibold">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
