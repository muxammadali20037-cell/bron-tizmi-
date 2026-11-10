"use client";

import { useId, useState } from "react";
import { groupSlotsByPeriod } from "@/lib/booking/slots";
import { formatTimeOfDay } from "@/lib/booking/time";
import { cn } from "@/lib/utils";

export type TimeSlot = {
  /** Kun boshidan daqiqalar (yarim tundan keyingi slot 1440 dan katta). */
  minutes: number;
  /** Bu vaqtda mos stol bormi (bazadagi get_availability natijasi). */
  available: boolean;
};

type SlotGridProps = {
  /** Forma uchun: tanlangan vaqt "HH:MM" ko‘rinishida shu nom bilan yuboriladi. */
  name: string;
  legend: string;
  slots: TimeSlot[];
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (minutes: number) => void;
  labels: {
    day: string;
    evening: string;
    /** Band slot uchun ekran o‘quvchiga o‘qiladigan so‘z, masalan "band". */
    unavailable: string;
    empty: string;
  };
  className?: string;
};

/**
 * Vaqt slotlari. Oddiy radio tugmalar asosida: o‘q tugmalari bilan yuriladi,
 * band vaqtlar tanlanmaydi va "band" deb o‘qiladi. Ro‘yxat bo‘sh bo‘lsa — tushuntirish.
 */
export function SlotGrid({
  name,
  legend,
  slots,
  value,
  defaultValue = null,
  onValueChange,
  labels,
  className,
}: SlotGridProps) {
  const [inner, setInner] = useState<number | null>(defaultValue);
  const selected = value === undefined ? inner : value;
  const legendId = useId();

  if (slots.length === 0 || slots.every((slot) => !slot.available)) {
    return (
      <div className={className}>
        <p id={legendId} className="text-sm font-semibold">
          {legend}
        </p>
        <p className="text-muted-foreground bg-muted mt-3 rounded-xl px-4 py-5 text-center text-sm">
          {labels.empty}
        </p>
      </div>
    );
  }

  const byMinutes = new Map(slots.map((slot) => [slot.minutes, slot]));
  const groups = groupSlotsByPeriod(slots.map((slot) => slot.minutes));

  function select(minutes: number) {
    if (value === undefined) setInner(minutes);
    onValueChange?.(minutes);
  }

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="text-sm font-semibold">{legend}</legend>
      {(
        [
          ["day", groups.day],
          ["evening", groups.evening],
        ] as const
      ).map(([period, minutesList]) =>
        minutesList.length === 0 ? null : (
          <div key={period} className="mt-3">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {labels[period]}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {minutesList.map((minutes) => {
                const slot = byMinutes.get(minutes)!;
                const time = formatTimeOfDay(minutes);
                const checked = selected === minutes;
                return (
                  <label
                    key={minutes}
                    className={cn(
                      "relative flex h-11 items-center justify-center rounded-lg border text-[0.9375rem] font-semibold tabular-nums transition-colors",
                      "has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2",
                      slot.available
                        ? checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-card hover:border-primary cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed border-transparent line-through decoration-1",
                    )}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={time}
                      checked={checked}
                      disabled={!slot.available}
                      onChange={() => select(minutes)}
                      className="sr-only"
                    />
                    {time}
                    {!slot.available ? (
                      <span className="sr-only">, {labels.unavailable}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        ),
      )}
    </fieldset>
  );
}
