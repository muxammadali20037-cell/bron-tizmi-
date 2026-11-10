"use client";

import { createContext, useContext, useId } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

type FieldContextValue = {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** Maydon ichidagi input/textarea shu orqali id, xato va izohni oladi. */
export function useFieldControl() {
  return useContext(FieldContext);
}

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-foreground text-sm leading-none font-medium select-none", className)}
      {...props}
    />
  );
}

type FieldProps = {
  label: React.ReactNode;
  /** Maydon tagidagi izoh (masalan, format namunasi). */
  hint?: React.ReactNode;
  /** Xato matni. Bo‘lsa, maydon `aria-invalid` bo‘ladi va xato ekran o‘quvchiga o‘qiladi. */
  error?: React.ReactNode;
  required?: boolean;
  /** "ixtiyoriy" so‘zi — tarjimadan keladi. */
  optionalLabel?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
};

/** Yorliq + boshqaruv elementi + izoh + xato. Ularni ARIA orqali o‘zaro bog‘laydi. */
export function Field({
  label,
  hint,
  error,
  required = false,
  optionalLabel,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, invalid: Boolean(error), required }}>
      <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
        <Label htmlFor={controlId}>
          {label}
          {!required && optionalLabel && (
            <span className="text-muted-foreground font-normal"> ({optionalLabel})</span>
          )}
        </Label>
        {children}
        {error ? (
          <p id={errorId} className="text-destructive text-sm leading-snug">
            {error}
          </p>
        ) : null}
        {hint ? (
          <p id={hintId} className="text-muted-foreground text-sm leading-snug">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/** Input/Textarea uchun umumiy: Field kontekstidan id va ARIA atributlarini qo‘shadi. */
export function useFieldProps<T extends { id?: string; required?: boolean }>(
  props: T & { "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"] },
) {
  const field = useFieldControl();
  const describedBy =
    [props["aria-describedby"], field?.describedBy].filter(Boolean).join(" ") || undefined;
  return {
    id: props.id ?? field?.controlId,
    required: props.required ?? (field?.required || undefined),
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
  };
}
