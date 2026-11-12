"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { updateProfileAction, type ProfileState } from "./actions";

export function ProfileForm({
  locale,
  defaults,
  texts,
}: {
  locale: Locale;
  defaults: { fullName: string; locale: Locale };
  texts: {
    nameLabel: string;
    nameError: string;
    languageLabel: string;
    save: string;
    saved: string;
    error: string;
  };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, {
    status: "idle",
  });

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="pageLocale" value={locale} />
      <Field label={texts.nameLabel} error={state.nameError ? texts.nameError : null} required>
        <Input
          name="fullName"
          defaultValue={defaults.fullName}
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />
      </Field>

      <fieldset>
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
                defaultChecked={value === defaults.locale}
                className="sr-only"
              />
              {localeLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite">
        {state.status === "saved" ? <Alert tone="success" title={texts.saved} /> : null}
        {state.status === "error" && !state.nameError ? (
          <Alert tone="danger" title={texts.error} />
        ) : null}
      </div>

      <div>
        <Button type="submit" loading={pending}>
          {texts.save}
        </Button>
      </div>
    </form>
  );
}
