"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import type { AppErrorCode } from "@/lib/auth/errors";
import type { Locale } from "@/lib/i18n/config";
import { acceptInvitationAction, declineInvitationAction, type InvitationState } from "./actions";

export function InvitationCard({
  invitationId,
  locale,
  text,
  expires,
  texts,
}: {
  invitationId: string;
  locale: Locale;
  text: string;
  expires: string;
  texts: { accept: string; decline: string; errors: Record<AppErrorCode, string> };
}) {
  const [acceptState, accept, accepting] = useActionState<InvitationState, FormData>(
    acceptInvitationAction,
    { status: "idle" },
  );
  const [declineState, decline, declining] = useActionState<InvitationState, FormData>(
    declineInvitationAction,
    { status: "idle" },
  );
  const error = acceptState.error ?? declineState.error;

  return (
    <li className="bg-card shadow-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex gap-3">
        <span className="bg-secondary text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Mail aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="leading-relaxed font-medium">{text}</p>
          <p className="text-muted-foreground text-sm">{expires}</p>
        </div>
      </div>
      {error ? <Alert tone="danger" title={texts.errors[error]} /> : null}
      <div className="flex flex-wrap gap-2">
        <form action={accept}>
          <input type="hidden" name="invitationId" value={invitationId} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" loading={accepting} disabled={declining}>
            {texts.accept}
          </Button>
        </form>
        <form action={decline}>
          <input type="hidden" name="invitationId" value={invitationId} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="ghost" loading={declining} disabled={accepting}>
            {texts.decline}
          </Button>
        </form>
      </div>
    </li>
  );
}
