"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Qisqa xabarlar (toast). Butun ilova uchun bitta, root layout'da turadi.
 * Xabar chiqarish: `import { toast } from "sonner"; toast.success("...")`.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            "bg-card! text-card-foreground! border-border! rounded-xl! shadow-overlay! font-sans!",
          description: "text-muted-foreground!",
          success: "[&_[data-icon]]:text-sage!",
          error: "[&_[data-icon]]:text-destructive!",
        },
      }}
    />
  );
}
