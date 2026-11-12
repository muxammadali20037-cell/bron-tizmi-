"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { controlClasses } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import type { AppErrorCode } from "@/lib/auth/errors";
import type { StaffRole } from "@/lib/auth/permissions";
import { interpolate } from "@/lib/i18n/format";
import { isValidNationalPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  inviteStaffAction,
  revokeInvitationAction,
  setStaffActiveAction,
  setStaffRoleAction,
  type StaffActionState,
} from "./actions";

export type StaffTexts = {
  roles: Record<StaffRole, string>;
  roleHelp: Partial<Record<StaffRole, string>>;
  errors: Record<AppErrorCode, string>;
  done: Record<NonNullable<StaffActionState["kind"]>, string>;
  roleLabel: string;
  save: string;
  cancel: string;
  close: string;
  deactivate: string;
  activate: string;
  deactivateTitle: string;
  deactivateText: string;
  revoke: string;
  invite: string;
  inviteRole: string;
  phoneLabel: string;
  phoneHint: string;
  countryCode: string;
  phoneRequired: string;
  phoneInvalid: string;
};

const initial: StaffActionState = { status: "idle" };

/**
 * Amal natijasini qisqa xabar (toast) bilan ko‘rsatadi. Har bir natija bir marta:
 * refresh() sahifani qayta chizganda (yangi props) xabar takrorlanmaydi.
 */
function useFeedback(state: StaffActionState, texts: StaffTexts) {
  const shown = useRef<StaffActionState>(initial);
  useEffect(() => {
    if (shown.current === state) return;
    shown.current = state;
    if (state.status === "done" && state.kind) toast.success(texts.done[state.kind]);
    if (state.status === "error") toast.error(texts.errors[state.error ?? "generic"]);
  }, [state, texts]);
}

/** Xodim rolini o‘zgartirish (faqat owner ko‘radi). "Saqlash" faqat tanlov o‘zgarsa chiqadi. */
export function RoleSelect({
  restaurantId,
  userId,
  name,
  current,
  options,
  texts,
}: {
  restaurantId: string;
  userId: string;
  name: string;
  current: StaffRole;
  options: StaffRole[];
  texts: StaffTexts;
}) {
  const [state, action, pending] = useActionState(setStaffRoleAction, initial);
  const [selected, setSelected] = useState<StaffRole>(current);
  useFeedback(state, texts);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        value={selected}
        onChange={(event) => setSelected(event.currentTarget.value as StaffRole)}
        aria-label={interpolate(texts.roleLabel, { name })}
        className={cn(controlClasses, "h-9 w-auto py-0 pr-8 text-sm")}
      >
        {options.map((role) => (
          <option key={role} value={role}>
            {texts.roles[role]}
          </option>
        ))}
      </select>
      {selected !== current ? (
        <Button type="submit" size="sm" loading={pending}>
          {texts.save}
        </Button>
      ) : null}
    </form>
  );
}

/** Xodimni o‘chirish (tasdiq bilan) yoki qayta yoqish. */
export function ActiveToggle({
  restaurantId,
  userId,
  name,
  active,
  texts,
}: {
  restaurantId: string;
  userId: string;
  name: string;
  active: boolean;
  texts: StaffTexts;
}) {
  const [state, action, pending] = useActionState(setStaffActiveAction, initial);
  const [open, setOpen] = useState(false);
  useFeedback(state, texts);

  if (!active) {
    return (
      <form action={action}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="active" value="true" />
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          {texts.activate}
        </Button>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="danger-ghost" onClick={() => setOpen(true)} loading={pending}>
        {texts.deactivate}
      </Button>
      <DialogContent closeLabel={texts.close}>
        <DialogHeader>
          <DialogTitle>{interpolate(texts.deactivateTitle, { name })}</DialogTitle>
          <DialogDescription>{texts.deactivateText}</DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            setOpen(false);
            action(formData);
          }}
        >
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value="false" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">{texts.cancel}</Button>
            </DialogClose>
            <Button type="submit" variant="danger">
              {texts.deactivate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RevokeInvitationButton({
  invitationId,
  texts,
}: {
  invitationId: string;
  texts: StaffTexts;
}) {
  const [state, action, pending] = useActionState(revokeInvitationAction, initial);
  useFeedback(state, texts);

  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" size="sm" variant="ghost" loading={pending}>
        {texts.revoke}
      </Button>
    </form>
  );
}

/** Telefon raqam va rol bo‘yicha taklif yaratish. */
export function InviteForm({
  restaurantId,
  roles,
  texts,
}: {
  restaurantId: string;
  roles: StaffRole[];
  texts: StaffTexts;
}) {
  const [state, action, pending] = useActionState(inviteStaffAction, initial);
  const [digits, setDigits] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [lastDone, setLastDone] = useState<number | undefined>(undefined);
  useFeedback(state, texts);

  // Taklif yaratilgach maydonni tozalaymiz (keyingi xodim uchun)
  if (state.status === "done" && state.at !== lastDone) {
    setLastDone(state.at);
    setDigits("");
  }

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
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <Field label={texts.phoneLabel} hint={texts.phoneHint} error={phoneError} required>
        <PhoneInput
          name="phone"
          value={digits}
          onValueChange={(value) => {
            setDigits(value);
            if (phoneError) setPhoneError(null);
          }}
          countryCodeLabel={texts.countryCode}
          autoComplete="off"
          required
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{texts.inviteRole}</legend>
        <div className="flex flex-col gap-2">
          {roles.map((role, index) => (
            <label
              key={role}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-3",
                "has-[:checked]:border-primary has-[:checked]:bg-secondary",
                "has-[:focus-visible]:ring-primary/30 has-[:focus-visible]:ring-[3px]",
              )}
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={index === roles.length - 1}
                className="accent-primary mt-1 size-4 shrink-0"
              />
              <span>
                <span className="block font-medium">{texts.roles[role]}</span>
                {texts.roleHelp[role] ? (
                  <span className="text-muted-foreground block text-sm">
                    {texts.roleHelp[role]}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Button type="submit" loading={pending}>
          {texts.invite}
        </Button>
      </div>
    </form>
  );
}

export function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: { active: string; inactive: string };
}) {
  return (
    <Badge tone={active ? "success" : "neutral"}>{active ? labels.active : labels.inactive}</Badge>
  );
}
