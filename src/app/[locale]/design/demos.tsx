"use client";

import { CalendarCheck, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PartySizeStepper } from "@/components/booking/party-size-stepper";
import { SlotGrid, type TimeSlot } from "@/components/booking/slot-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  SheetContent,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatTimeOfDay } from "@/lib/booking/time";
import type { Locale } from "@/lib/i18n/config";
import type { PluralForms } from "@/lib/i18n/format";
import { isValidNationalPhone } from "@/lib/phone";

/** Ichki /design sahifasining interaktiv namunalari. Hech narsa serverga yuborilmaydi. */

export function LoadingButtonDemo({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 1500);
      }}
    >
      {label}
    </Button>
  );
}

type FormLabels = {
  phone: {
    label: string;
    hint: string;
    countryCode: string;
    errors: { required: string; invalid: string };
  };
  optional: string;
  save: string;
};

export function FormDemo({ labels }: { labels: FormLabels }) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const phoneError = !submitted
    ? undefined
    : phone.length === 0
      ? labels.phone.errors.required
      : !isValidNationalPhone(phone)
        ? labels.phone.errors.invalid
        : undefined;

  return (
    <form
      noValidate
      className="flex max-w-md flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (isValidNationalPhone(phone)) toast.success(`+998 ${phone}`);
      }}
    >
      <Field label="Ism" required>
        <Input autoComplete="given-name" placeholder="Aziza" />
      </Field>
      <Field label={labels.phone.label} hint={labels.phone.hint} error={phoneError} required>
        <PhoneInput
          name="phone"
          value={phone}
          onValueChange={setPhone}
          countryCodeLabel={labels.phone.countryCode}
        />
      </Field>
      <Field label="Maxsus talab" optionalLabel={labels.optional}>
        <Textarea placeholder="Deraza yonidagi stol, bolalar stuli…" />
      </Field>
      <Button type="submit" className="self-start">
        <Check aria-hidden="true" />
        {labels.save}
      </Button>
    </form>
  );
}

export function OverlayDemo({
  labels,
}: {
  labels: { close: string; cancel: string; confirm: string };
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Dialog</Button>
        </DialogTrigger>
        <DialogContent closeLabel={labels.close}>
          <DialogHeader>
            <DialogTitle>Bronni bekor qilasizmi?</DialogTitle>
            <DialogDescription>
              Namuna oyna. Haqiqiy bekor qilish Sprint 8&apos;da baza funksiyasi orqali ishlaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">{labels.cancel}</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger" onClick={() => toast("Namuna: hech narsa o‘zgarmadi")}>
                {labels.confirm}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Pastki panel</Button>
        </DialogTrigger>
        <SheetContent side="bottom" closeLabel={labels.close}>
          <DialogTitle>Filtrlar</DialogTitle>
          <DialogDescription>
            Mobil telefonda filtrlar va tanlovlar shu panelda ochiladi.
          </DialogDescription>
        </SheetContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">O‘ng panel</Button>
        </DialogTrigger>
        <SheetContent side="right" closeLabel={labels.close}>
          <DialogTitle>Bron tafsiloti</DialogTitle>
          <DialogDescription>
            Restoran panelida bron tafsiloti shu yerda ochiladi.
          </DialogDescription>
        </SheetContent>
      </Dialog>

      <Button variant="soft" onClick={() => toast.success("Saqlandi")}>
        Toast
      </Button>
    </div>
  );
}

type BookingLabels = {
  slots: { label: string; day: string; evening: string; unavailable: string; empty: string };
  party: {
    label: string;
    decrease: string;
    increase: string;
    guests: PluralForms;
    max: string;
  };
};

export function BookingDemo({
  locale,
  slots,
  labels,
}: {
  locale: Locale;
  slots: TimeSlot[];
  labels: BookingLabels;
}) {
  const [party, setParty] = useState(2);
  const [time, setTime] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PartySizeStepper
        locale={locale}
        value={party}
        onValueChange={setParty}
        max={12}
        labels={labels.party}
      />
      <SlotGrid
        name="time"
        legend={labels.slots.label}
        slots={slots}
        value={time}
        onValueChange={setTime}
        labels={labels.slots}
      />
      <p className="text-muted-foreground flex items-center gap-2 text-sm" aria-live="polite">
        <CalendarCheck aria-hidden="true" className="size-4" />
        {time === null ? "Vaqt tanlanmagan" : `${party} · ${formatTimeOfDay(time)}`}
      </p>
      <SlotGrid
        name="time-empty"
        legend={`${labels.slots.label} (bo‘sh holat)`}
        slots={[]}
        labels={labels.slots}
      />
    </div>
  );
}
