"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import type { AuthErrorKey } from "@/lib/auth/errors";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/format";
import { formatE164ForDisplay, isValidNationalPhone } from "@/lib/phone";
import {
  requestCodeAction,
  verifyCodeAction,
  type RequestCodeState,
  type VerifyCodeState,
} from "./actions";

/** Kodni qayta so‘rash oralig‘i (Supabase'ning raqam bo‘yicha 60 soniyalik cheklovi bilan bir xil). */
const RESEND_AFTER_SECONDS = 60;

export type LoginTexts = {
  sendCode: string;
  codeTitle: string;
  codeSentTo: string;
  codeLabel: string;
  codeRequired: string;
  verify: string;
  resendIn: string;
  resend: string;
  changePhone: string;
  phoneLabel: string;
  phoneHint: string;
  countryCode: string;
  phoneRequired: string;
  phoneInvalid: string;
  errors: Record<AuthErrorKey, string>;
};

type Sent = { phone: string; sentAt: number };

/**
 * Kirish: 1) telefon raqam → SMS kod yuboriladi, 2) kod → tasdiqlanadi.
 * Holat serverdagi Server Action'larda; bu komponent faqat qadamlarni ko‘rsatadi.
 */
export function LoginForm({
  locale,
  next,
  texts,
}: {
  locale: Locale;
  next: string;
  texts: LoginTexts;
}) {
  const [requestState, requestAction, requesting] = useActionState<RequestCodeState, FormData>(
    requestCodeAction,
    { status: "idle" },
  );
  const [lastSent, setLastSent] = useState<Sent | null>(null);
  const [dismissedSentAt, setDismissedSentAt] = useState<number | null>(null);
  const [digits, setDigits] = useState("");

  // Muvaffaqiyatli yuborishni eslab qolamiz: keyingi "qayta yuborish" xato bersa ham kod qadami yopilmaydi
  if (requestState.status === "sent" && requestState.sentAt !== lastSent?.sentAt) {
    setLastSent({ phone: requestState.phone, sentAt: requestState.sentAt });
  }

  const requestError = requestState.status === "error" ? texts.errors[requestState.error] : null;
  const showCode = lastSent !== null && lastSent.sentAt !== dismissedSentAt;

  if (showCode) {
    return (
      <CodeStep
        key={lastSent.sentAt}
        sent={lastSent}
        locale={locale}
        next={next}
        texts={texts}
        resendAction={requestAction}
        resending={requesting}
        resendError={requestError}
        onChangePhone={() => {
          setDismissedSentAt(lastSent.sentAt);
          setDigits(lastSent.phone.slice(4));
        }}
      />
    );
  }

  return (
    <PhoneStep
      texts={texts}
      action={requestAction}
      pending={requesting}
      serverError={requestError}
      digits={digits}
      onDigitsChange={setDigits}
    />
  );
}

function PhoneStep({
  texts,
  action,
  pending,
  serverError,
  digits,
  onDigitsChange,
}: {
  texts: LoginTexts;
  action: (formData: FormData) => void;
  pending: boolean;
  serverError: string | null;
  digits: string;
  onDigitsChange: (digits: string) => void;
}) {
  const [phoneError, setPhoneError] = useState<string | null>(null);

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        const error = !digits
          ? texts.phoneRequired
          : isValidNationalPhone(digits)
            ? null
            : texts.phoneInvalid;
        setPhoneError(error);
        if (error) event.preventDefault();
      }}
    >
      {serverError ? <Alert tone="danger" title={serverError} /> : null}
      <Field label={texts.phoneLabel} hint={texts.phoneHint} error={phoneError} required>
        <PhoneInput
          name="phone"
          value={digits}
          onValueChange={(value) => {
            onDigitsChange(value);
            if (phoneError) setPhoneError(null);
          }}
          countryCodeLabel={texts.countryCode}
          autoFocus
          required
        />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {texts.sendCode}
      </Button>
    </form>
  );
}

function CodeStep({
  sent,
  locale,
  next,
  texts,
  resendAction,
  resending,
  resendError,
  onChangePhone,
}: {
  sent: Sent;
  locale: Locale;
  next: string;
  texts: LoginTexts;
  resendAction: (formData: FormData) => void;
  resending: boolean;
  resendError: string | null;
  onChangePhone: () => void;
}) {
  const [verifyState, verifyAction, verifying] = useActionState<VerifyCodeState, FormData>(
    verifyCodeAction,
    { status: "idle" },
  );
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - sent.sentAt) / 1000));
  const verifyError =
    verifyState.status === "error"
      ? verifyState.error === "codeRequired"
        ? texts.codeRequired
        : texts.errors[verifyState.error]
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{texts.codeTitle}</h2>
        <p className="text-muted-foreground mt-1 leading-relaxed" aria-live="polite">
          {interpolate(texts.codeSentTo, { phone: formatE164ForDisplay(sent.phone) })}
        </p>
      </div>

      <form action={verifyAction} noValidate className="flex flex-col gap-5">
        <input type="hidden" name="phone" value={sent.phone} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next} />
        <Field label={texts.codeLabel} error={verifyError} required>
          <Input
            name="code"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            required
            className="h-12 text-center text-xl tracking-[0.5em] tabular-nums"
          />
        </Field>
        <Button type="submit" size="lg" block loading={verifying} disabled={code.length !== 6}>
          {texts.verify}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-3 text-sm">
        {resendError ? <Alert tone="danger" title={resendError} className="w-full" /> : null}
        <form action={resendAction}>
          <input type="hidden" name="phone" value={sent.phone} />
          {secondsLeft > 0 ? (
            <p className="text-muted-foreground">
              {interpolate(texts.resendIn, { seconds: secondsLeft })}
            </p>
          ) : (
            <Button type="submit" variant="link" loading={resending}>
              {texts.resend}
            </Button>
          )}
        </form>
        <Button variant="ghost" size="sm" onClick={onChangePhone}>
          {texts.changePhone}
        </Button>
      </div>
    </div>
  );
}
