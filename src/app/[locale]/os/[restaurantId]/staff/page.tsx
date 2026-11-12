import type { Metadata } from "next";
import { Forbidden } from "@/components/shared/forbidden";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { requireRestaurantAccess } from "@/lib/auth/dal";
import { canChangeRoles, canManageRole, invitableRoles, staffRoles } from "@/lib/auth/permissions";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { formatDate, interpolate } from "@/lib/i18n/format";
import { formatE164ForDisplay } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OsShell } from "../os-shell";
import {
  ActiveToggle,
  InviteForm,
  RevokeInvitationButton,
  RoleSelect,
  StatusBadge,
  type StaffTexts,
} from "./staff-client";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.staff.metaTitle, robots: { index: false } };
}

/** Jamoa: a’zolar, takliflar. Faqat owner va manager uchun. */
export default async function StaffPage({
  params,
}: PageProps<"/[locale]/os/[restaurantId]/staff">) {
  const [dict, locale, { restaurantId }] = await Promise.all([
    getDictionary(),
    getLocale(),
    params,
  ]);
  const { viewer, membership } = await requireRestaurantAccess(
    locale,
    restaurantId,
    `/${locale}/os/${restaurantId}/staff`,
    ["owner", "manager"],
  );

  if (!membership) {
    return (
      <Forbidden
        title={dict.forbidden.title}
        description={dict.forbidden.description}
        backLabel={dict.forbidden.back}
        backHref={`/${locale}/profile`}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const [membersResult, invitationsResult] = await Promise.all([
    supabase.rpc("get_restaurant_staff", { p_restaurant_id: restaurantId }),
    supabase
      .from("staff_invitations")
      .select("id, phone, role, expires_at")
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  if (membersResult.error)
    throw new Error("Jamoani o‘qib bo‘lmadi", { cause: membersResult.error });
  if (invitationsResult.error) {
    throw new Error("Takliflarni o‘qib bo‘lmadi", { cause: invitationsResult.error });
  }

  const members = membersResult.data;
  const invitations = invitationsResult.data;
  const { staff } = dict;
  const actor = membership.role;

  const texts: StaffTexts = {
    roles: dict.roles,
    roleHelp: staff.roleHelp,
    errors: dict.appErrors,
    done: {
      invited: staff.invited,
      revoked: staff.revoked,
      roleChanged: staff.roleChanged,
      activated: staff.activated,
      deactivated: staff.deactivated,
    },
    roleLabel: staff.roleLabel,
    save: dict.common.save,
    cancel: dict.common.cancel,
    close: dict.common.close,
    deactivate: staff.deactivate,
    activate: staff.activate,
    deactivateTitle: staff.deactivateTitle,
    deactivateText: staff.deactivateText,
    revoke: staff.revoke,
    invite: staff.invite,
    inviteRole: staff.inviteRole,
    phoneLabel: dict.phone.label,
    phoneHint: dict.phone.hint,
    countryCode: dict.phone.countryCode,
    phoneRequired: dict.phone.errors.required,
    phoneInvalid: dict.phone.errors.invalid,
  };

  return (
    <OsShell
      locale={locale}
      dict={dict}
      membership={membership}
      current="staff"
      title={staff.title}
    >
      <div className="flex flex-col gap-6">
        {!canChangeRoles(actor) ? <Alert tone="info" title={staff.readOnly} /> : null}

        <section aria-labelledby="members-title" className="flex flex-col gap-3">
          <h2 id="members-title" className="text-lg font-semibold">
            {staff.membersTitle}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{staff.name}</TableHead>
                <TableHead>{staff.phone}</TableHead>
                <TableHead>{staff.role}</TableHead>
                <TableHead>{staff.status}</TableHead>
                <TableHead>
                  <span className="sr-only">{staff.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.user_id === viewer.id;
                const name = member.full_name || staff.noName;
                const manageable = !isSelf && canManageRole(actor, member.role);
                return (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      {name}
                      {isSelf ? (
                        <span className="text-muted-foreground font-normal"> ({staff.you})</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatE164ForDisplay(member.phone)}
                    </TableCell>
                    <TableCell>
                      {canChangeRoles(actor) && !isSelf ? (
                        <RoleSelect
                          restaurantId={restaurantId}
                          userId={member.user_id}
                          name={name}
                          current={member.role}
                          options={[...staffRoles]}
                          texts={texts}
                        />
                      ) : (
                        <Badge tone={member.role === "owner" ? "gold" : "neutral"}>
                          {dict.roles[member.role]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        active={member.is_active}
                        labels={{ active: staff.active, inactive: staff.inactive }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {manageable ? (
                        <ActiveToggle
                          restaurantId={restaurantId}
                          userId={member.user_id}
                          name={name}
                          active={member.is_active}
                          texts={texts}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle as="h2">{staff.inviteTitle}</CardTitle>
              <CardDescription>{staff.inviteDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm restaurantId={restaurantId} roles={invitableRoles(actor)} texts={texts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">{staff.pendingTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-muted-foreground">{staff.pendingEmpty}</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {invitations.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium tabular-nums">
                          {formatE164ForDisplay(invitation.phone)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {dict.roles[invitation.role]} ·{" "}
                          {interpolate(staff.expires, {
                            date: formatDate(invitation.expires_at, locale),
                          })}
                        </p>
                      </div>
                      {canManageRole(actor, invitation.role) ? (
                        <RevokeInvitationButton invitationId={invitation.id} texts={texts} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OsShell>
  );
}
