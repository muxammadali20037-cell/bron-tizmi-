"use client";

import { cn } from "@/lib/utils";
import { useFieldProps } from "./field";

/** Input va Textarea uchun umumiy ko‘rinish. 16 px shrift — iPhone'da avtomatik kattalashtirish bo‘lmaydi. */
export const controlClasses = cn(
  "border-input bg-card text-foreground w-full min-w-0 rounded-lg border px-3.5 text-base",
  "placeholder:text-muted-foreground/80 transition-[border-color,box-shadow]",
  "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] focus-visible:outline-none",
  "disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-70",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
);

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  const fieldProps = useFieldProps(props);
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(controlClasses, "h-11", className)}
      {...props}
      {...fieldProps}
    />
  );
}

export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  const fieldProps = useFieldProps(props);
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(controlClasses, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
      {...props}
      {...fieldProps}
    />
  );
}
