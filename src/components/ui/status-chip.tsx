import {
  Ban,
  CalendarCheck,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  Clock,
  Hourglass,
  Lock,
  UserCheck,
  UserX,
  Wallet,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import type { ReservationStatus, TableStatus } from "@/lib/booking/statuses";
import { Badge, type BadgeTone } from "./badge";

/**
 * Holat belgisi: rang + belgi + so‘z birga (rangni ajrata olmaydigan foydalanuvchi uchun ham).
 * Matn chaqiruvchi tomondan tarjima qilingan holda beriladi.
 */

const reservationLook: Record<ReservationStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  pending: { tone: "warning", icon: Clock },
  awaiting_payment: { tone: "warning", icon: Wallet },
  confirmed: { tone: "success", icon: CircleCheck },
  checked_in: { tone: "brand", icon: UserCheck },
  completed: { tone: "neutral", icon: CheckCheck },
  cancelled: { tone: "neutral", icon: CircleX },
  rejected: { tone: "danger", icon: Ban },
  expired: { tone: "neutral", icon: Hourglass },
  no_show: { tone: "danger", icon: UserX },
};

const tableLook: Record<TableStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  available: { tone: "success", icon: CircleDashed },
  reserved: { tone: "outline", icon: CalendarCheck },
  occupied: { tone: "warning", icon: UserCheck },
  blocked: { tone: "neutral", icon: Lock },
  unavailable: { tone: "neutral", icon: Ban },
};

export function ReservationStatusChip({
  status,
  label,
  className,
}: {
  status: ReservationStatus;
  label: string;
  className?: string;
}) {
  const { tone, icon: Icon } = reservationLook[status];
  return (
    <Badge tone={tone} className={className} data-status={status}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function TableStatusChip({
  status,
  label,
  className,
}: {
  status: TableStatus;
  label: string;
  className?: string;
}) {
  const { tone, icon: Icon } = tableLook[status];
  return (
    <Badge tone={tone} className={className} data-status={status}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
