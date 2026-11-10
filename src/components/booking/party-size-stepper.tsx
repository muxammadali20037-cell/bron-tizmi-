"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { interpolate, plural, type PluralForms } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

type PartySizeStepperProps = {
  locale: Locale;
  name?: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (count: number) => void;
  /** Restoran bron qoidalaridan (booking_rules) keladi. */
  min?: number;
  max: number;
  labels: {
    label: string;
    decrease: string;
    increase: string;
    guests: PluralForms;
    /** "{count} kishidan ko‘p bo‘lsa, restoranga qo‘ng‘iroq qiling" */
    max: string;
  };
  className?: string;
};

/** Mehmonlar sonini tanlash: − / + tugmalari, son ekran o‘quvchiga o‘qiladi. */
export function PartySizeStepper({
  locale,
  name,
  value,
  defaultValue = 2,
  onValueChange,
  min = 1,
  max,
  labels,
  className,
}: PartySizeStepperProps) {
  const [inner, setInner] = useState(() => Math.min(Math.max(defaultValue, min), max));
  const count = value ?? inner;
  const labelId = useId();

  function change(next: number) {
    const clamped = Math.min(Math.max(next, min), max);
    if (clamped === count) return;
    if (value === undefined) setInner(clamped);
    onValueChange?.(clamped);
  }

  const stepButton =
    "border-input bg-card text-foreground hover:border-primary inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p id={labelId} className="text-sm font-semibold">
        {labels.label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-4">
        <button
          type="button"
          className={stepButton}
          onClick={() => change(count - 1)}
          disabled={count <= min}
          aria-label={labels.decrease}
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <output
          aria-live="polite"
          className="min-w-24 text-center text-lg font-semibold tabular-nums"
        >
          {plural(locale, count, labels.guests)}
        </output>
        <button
          type="button"
          className={stepButton}
          onClick={() => change(count + 1)}
          disabled={count >= max}
          aria-label={labels.increase}
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
      {count >= max ? (
        <p className="text-muted-foreground text-sm">{interpolate(labels.max, { count: max })}</p>
      ) : null}
      {name ? <input type="hidden" name={name} value={count} /> : null}
    </div>
  );
}
