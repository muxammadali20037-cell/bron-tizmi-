"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AppErrorCode } from "@/lib/auth/errors";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { completeOnboardingAction, type OnboardingState } from "./actions";

export type OnboardingTexts = {
  nameLabel: string;
  nameHint: string;
  nameError: string;
  languageLabel: string;
  consentBefore: string;
  consentLink: string;
  consentAfter: string;
  consentError: string;
  submit: string;
  errors: Record<AppErrorCode, string>;
};

export function OnboardingForm({
  locale,
  next,
  defaultName,
  texts,
}: {
  locale: Locale;
  next: string;
  defaultName: string;
  texts: OnboardingTexts;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    { status: "idle" },
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="pageLocale" value={locale} />
      <input type="hidden" name="next" value={next} />

      {state.error ? <Alert tone="danger" title={texts.errors[state.error]} /> : null}

      <Field
        label={texts.nameLabel}
        hint={texts.nameHint}
        error={state.fieldErrors?.name ? texts.nameError : null}
        required
      >
        <Input
          name="fullName"
          defaultValue={defaultName}
          autoComplete="name"
          minLength={2}
          maxLength={100}
          autoFocus
          required
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{texts.languageLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {locales.map((value) => (
            <label
              key={value}
              lang={value}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium",
                "has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-primary",
                "has-[:focus-visible]:ring-primary/30 has-[:focus-visible]:ring-[3px]",
              )}
            >
              <input
                type="radio"
                name="locale"
                value={value}
                defaultChecked={value === locale}
                className="sr-only"
              />
              {localeLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 leading-relaxed">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={state.fieldErrors?.consent || undefined}
            aria-describedby={state.fieldErrors?.consent ? "consent-error" : undefined}
            className="accent-primary mt-1 size-5 shrink-0"
          />
          <span>
            {texts.consentBefore}
            <Link
              href={`/${locale}/legal/privacy`}
              target="_blank"
              className="text-primary underline underline-offset-4"
            >
              {texts.consentLink}
            </Link>
            {texts.consentAfter}
          </span>
        </label>
        {state.fieldErrors?.consent ? (
          <p id="consent-error" className="text-destructive text-sm">
            {texts.consentError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" block loading={pending}>
        {texts.submit}
      </Button>
    </form>
  );
}
