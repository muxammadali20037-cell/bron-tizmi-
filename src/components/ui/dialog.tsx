"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * Modal oyna (Radix Dialog): fokus oyna ichida ushlanadi, Esc yopadi, yopilganda fokus
 * ochgan tugmaga qaytadi. Sarlavha har doim bo‘lishi shart (ekran o‘quvchi uchun).
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  closeLabel,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { closeLabel: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-fade-in bg-charcoal/45 fixed inset-0 z-50" />
      <DialogPrimitive.Content
        className={cn(
          "bg-popover text-popover-foreground shadow-overlay fixed z-50 flex flex-col gap-4 rounded-2xl p-6",
          "top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
          "data-[state=open]:animate-fade-in max-h-[calc(100dvh-2rem)] overflow-y-auto focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-lg transition-colors"
          aria-label={closeLabel}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-snug font-semibold", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

/**
 * Yon yoki pastki panel (o‘sha Radix Dialog asosida).
 * Mobil telefonda pastdan chiqadi, restoran panelida o‘ngdan.
 */
export function SheetContent({
  side = "bottom",
  className,
  children,
  closeLabel,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "bottom" | "right";
  closeLabel: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-fade-in bg-charcoal/45 fixed inset-0 z-50" />
      <DialogPrimitive.Content
        className={cn(
          "bg-popover text-popover-foreground shadow-overlay fixed z-50 flex flex-col gap-4 overflow-y-auto p-6 focus:outline-none",
          side === "bottom" &&
            "data-[state=open]:animate-slide-up inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          side === "right" &&
            "data-[state=open]:animate-slide-in-right inset-y-0 right-0 w-full max-w-md",
          className,
        )}
        {...props}
      >
        {side === "bottom" ? (
          <span aria-hidden="true" className="bg-border mx-auto -mt-2 h-1.5 w-10 rounded-full" />
        ) : null}
        {children}
        <DialogPrimitive.Close
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-lg transition-colors"
          aria-label={closeLabel}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
