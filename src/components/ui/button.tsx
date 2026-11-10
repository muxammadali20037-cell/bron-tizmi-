import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap select-none",
    "transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:size-[1.125em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-forest/90",
        secondary: "border-[1.5px] border-primary bg-transparent text-primary hover:bg-secondary",
        soft: "bg-secondary text-secondary-foreground hover:bg-[#dbe6e1]",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "danger-ghost": "text-destructive hover:bg-destructive-soft",
        link: "h-auto px-0 text-primary underline underline-offset-4 hover:no-underline active:scale-100",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-[0.9375rem]",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Bolani tugma sifatida ko‘rsatish (masalan, Link). */
    asChild?: boolean;
    /** Amal bajarilmoqda: tugma bosilmaydi, aylanuvchi belgi ko‘rinadi. */
    loading?: boolean;
  };

/**
 * Asosiy tugma. Kamida 44 px balandlik (md) — barmoq bilan bosishga qulay.
 * `loading` paytida tugma o‘chadi va `aria-busy` qo‘yiladi, matn o‘z joyida qoladi.
 */
export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, block }), className);

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="animate-spin" />}
      {children}
    </button>
  );
}
