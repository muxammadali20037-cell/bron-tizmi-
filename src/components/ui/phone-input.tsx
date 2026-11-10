"use client";

import { useId, useLayoutEffect, useReducer, useRef, useState } from "react";
import {
  applyPhoneEdit,
  formatNationalPhone,
  normalizeUzPhone,
  UZ_COUNTRY_CODE,
  UZ_NATIONAL_LENGTH,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import { useFieldProps } from "./field";
import { controlClasses } from "./input";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "name"
> & {
  /** Milliy raqamlar (9 tagacha), masalan "901234567". Berilsa — boshqariladigan rejim. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (digits: string) => void;
  /** Forma uchun: shu nom bilan E.164 qiymat ("+998901234567") yashirin maydonda yuboriladi. */
  name?: string;
  /** Ekran o‘quvchi uchun: "Mamlakat kodi: +998". */
  countryCodeLabel: string;
};

/**
 * O‘zbekiston telefon raqami maydoni. +998 doim ko‘rinib turadi, foydalanuvchi faqat
 * 9 raqam yozadi. "90 123 45 67" ko‘rinishiga avtomatik keltiriladi, kursor joyi saqlanadi.
 * To‘liq "+998 ..." raqamni joylashtirsa (paste), kod o‘zi ajratiladi.
 */
export function PhoneInput({
  value,
  defaultValue = "",
  onValueChange,
  name,
  countryCodeLabel,
  className,
  ...props
}: PhoneInputProps) {
  const [innerDigits, setInnerDigits] = useState(() =>
    defaultValue.replace(/\D/g, "").slice(0, UZ_NATIONAL_LENGTH),
  );
  const digits = value ?? innerDigits;
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const prefixId = useId();
  const fieldProps = useFieldProps(props);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (pendingCaret.current === null || !input || document.activeElement !== input) return;
    input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? "";
    const deletion = inputType.endsWith("Backward")
      ? "backward"
      : inputType.endsWith("Forward")
        ? "forward"
        : undefined;

    const result = applyPhoneEdit({
      previousDigits: digits,
      rawValue: input.value,
      caret: input.selectionStart ?? input.value.length,
      deletion,
    });

    pendingCaret.current = result.caret;
    if (value === undefined) setInnerDigits(result.digits);
    if (result.digits !== digits) onValueChange?.(result.digits);
    // Raqam o‘zgarmagan bo‘lsa ham (masalan, harf yozildi) kursorni joyiga qaytarish uchun
    rerender();
  }

  const describedBy = [prefixId, fieldProps["aria-describedby"]].filter(Boolean).join(" ");

  return (
    <div
      data-slot="phone-input"
      className={cn(
        controlClasses,
        "flex h-11 items-center gap-2 px-0",
        "focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]",
        "has-[input[aria-invalid=true]]:border-destructive",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground border-border flex h-full items-center border-r pr-2.5 pl-3.5 tabular-nums"
      >
        +{UZ_COUNTRY_CODE}
      </span>
      <span id={prefixId} className="sr-only">
        {countryCodeLabel}
      </span>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="90 123 45 67"
        className="placeholder:text-muted-foreground/80 h-full min-w-0 flex-1 bg-transparent pr-3.5 tabular-nums outline-none"
        {...props}
        {...fieldProps}
        aria-describedby={describedBy}
        value={formatNationalPhone(digits)}
        onChange={handleChange}
      />
      {name ? <input type="hidden" name={name} value={normalizeUzPhone(digits) ?? ""} /> : null}
    </div>
  );
}
