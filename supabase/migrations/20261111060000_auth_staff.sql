-- Sprint 3: kirish (SMS limit), onboarding, kirish huquqlari va xodimlarni boshqarish.
-- Yozish faqat shu funksiyalar orqali: ular chaqiruvchining rolini o'zi tekshiradi.
-- Xato kodlari `detail` maydonida (ilova ularni 3 tilga tarjima qiladi).

-- ---------------------------------------------------------------------------
-- Taklifni rad etish holati
-- ---------------------------------------------------------------------------

alter type public.invitation_status add value if not exists 'declined';

-- ---------------------------------------------------------------------------
-- Yordamchilar
-- ---------------------------------------------------------------------------

create or replace function private.raise_app_error(p_code text, p_message text, p_errcode text default 'P0001')
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = p_errcode, message = p_message, detail = p_code;
end;
$$;

-- Joriy foydalanuvchi. Kirmagan bo'lsa — xato.
create or replace function private.require_uid()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    perform private.raise_app_error('not_authenticated', 'Avval tizimga kiring', '42501');
  end if;
  return v_uid;
end;
$$;

-- Joriy foydalanuvchining shu restorandagi faol roli (yo'q bo'lsa null)
create or replace function private.my_restaurant_role(p_restaurant_id uuid)
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff_members
  where restaurant_id = p_restaurant_id
    and user_id = (select auth.uid())
    and is_active;
$$;

create or replace function private.my_phone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select phone from public.profiles where id = (select auth.uid());
$$;

-- Owner hammani, manager faqat host va staff'ni boshqaradi
create or replace function private.can_manage_role(p_actor public.staff_role, p_target public.staff_role)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_actor
    when 'owner' then true
    when 'manager' then p_target in ('host', 'staff')
    else false
  end;
$$;

-- Bu yordamchilarni faqat quyidagi security definer funksiyalar (egasi nomidan) chaqiradi
revoke all on function private.raise_app_error(text, text, text) from public;
revoke all on function private.require_uid() from public;
revoke all on function private.my_restaurant_role(uuid) from public;
revoke all on function private.my_phone() from public;
revoke all on function private.can_manage_role(public.staff_role, public.staff_role) from public;

-- ---------------------------------------------------------------------------
-- SMS limiti (Send SMS Hook chaqiradi, faqat service_role)
-- Telefon ochiq saqlanmaydi — faqat SHA-256 izi. 2 kundan eski yozuvlar o'chiriladi.
-- ---------------------------------------------------------------------------

create table private.sms_send_attempts (
  id bigint generated always as identity primary key,
  phone_hash text not null,
  created_at timestamptz not null default now()
);
create index sms_send_attempts_phone_time_idx on private.sms_send_attempts (phone_hash, created_at desc);
revoke all on private.sms_send_attempts from public, anon, authenticated;

create or replace function public.register_sms_attempt(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_last_10m int;
  v_last_hour int;
  v_last_day int;
begin
  if p_phone is null or p_phone !~ '^\+998[0-9]{9}$' then
    return jsonb_build_object('allowed', false, 'reason', 'unsupported_phone');
  end if;

  v_hash := encode(extensions.digest(p_phone, 'sha256'), 'hex');

  -- Bir raqam uchun bir vaqtda kelgan so'rovlar navbat bilan sanalsin
  perform pg_advisory_xact_lock(hashtextextended(v_hash, 0));

  delete from private.sms_send_attempts
  where phone_hash = v_hash and created_at < now() - interval '2 days';

  select
    count(*) filter (where created_at > now() - interval '10 minutes'),
    count(*) filter (where created_at > now() - interval '1 hour'),
    count(*)
  into v_last_10m, v_last_hour, v_last_day
  from private.sms_send_attempts
  where phone_hash = v_hash and created_at > now() - interval '1 day';

  if v_last_10m >= 3 or v_last_hour >= 5 or v_last_day >= 10 then
    return jsonb_build_object('allowed', false, 'reason', 'too_many_attempts');
  end if;

  insert into private.sms_send_attempts (phone_hash) values (v_hash);
  return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.register_sms_attempt(text) from public, anon, authenticated;
grant execute on function public.register_sms_attempt(text) to service_role;
comment on function public.register_sms_attempt(text) is
  'Send SMS Hook uchun: +998 raqam va limit (10 daqiqada 3, soatda 5, kunda 10). Faqat service_role.';

-- ---------------------------------------------------------------------------
-- Onboarding: ism, til va shartlarga rozilik. Rozilik vaqtini server qo'yadi.
-- ---------------------------------------------------------------------------

revoke update (terms_accepted_at) on public.profiles from authenticated;

create or replace function public.complete_onboarding(p_full_name text, p_locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_full_name, ''));
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    perform private.raise_app_error('invalid_name', 'Ism 2–100 belgidan iborat bo''lishi kerak', '22023');
  end if;
  if p_locale is null or p_locale not in ('uz', 'ru', 'en') then
    perform private.raise_app_error('invalid_locale', 'Noma''lum til', '22023');
  end if;

  update public.profiles
  set full_name = v_name,
      locale = p_locale,
      terms_accepted_at = coalesce(terms_accepted_at, now())
  where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kirish huquqlari: admin, restoranlardagi rollar va kutilayotgan takliflar soni
-- ---------------------------------------------------------------------------

create or replace function public.get_my_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'is_super_admin', exists (select 1 from public.platform_admins where user_id = (select auth.uid())),
    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
          'restaurant_id', r.id,
          'slug', r.slug,
          'name', r.name,
          'status', r.status,
          'role', sm.role
        ) order by r.created_at)
      from public.staff_members as sm
      join public.restaurants as r on r.id = sm.restaurant_id
      where sm.user_id = (select auth.uid()) and sm.is_active
    ), '[]'::jsonb),
    'pending_invitations', (
      select count(*)
      from public.staff_invitations as i
      where i.status = 'pending'
        and i.expires_at > now()
        and i.phone = private.my_phone()
    )
  )
  where (select auth.uid()) is not null;
$$;

-- ---------------------------------------------------------------------------
-- Xodimlar: ro'yxat, taklif, qabul qilish, rol va faollik
-- ---------------------------------------------------------------------------

create or replace function public.get_restaurant_staff(p_restaurant_id uuid)
returns table (
  user_id uuid,
  full_name text,
  phone text,
  role public.staff_role,
  is_active boolean,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_uid();
  if coalesce(private.my_restaurant_role(p_restaurant_id) in ('owner', 'manager'), false) is false
     and not private.is_super_admin() then
    perform private.raise_app_error('forbidden', 'Bu amal uchun ruxsat yo''q', '42501');
  end if;

  return query
    select sm.user_id, p.full_name, p.phone, sm.role, sm.is_active, sm.created_at
    from public.staff_members as sm
    join public.profiles as p on p.id = sm.user_id
    where sm.restaurant_id = p_restaurant_id
    order by sm.is_active desc, array_position(array['owner', 'manager', 'host', 'staff']::public.staff_role[], sm.role), sm.created_at;
end;
$$;

create or replace function public.invite_staff(p_restaurant_id uuid, p_phone text, p_role public.staff_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_actor public.staff_role := private.my_restaurant_role(p_restaurant_id);
  v_status public.restaurant_status;
  v_id uuid;
begin
  if v_actor is null or not private.can_manage_role(v_actor, p_role) or p_role = 'owner' then
    perform private.raise_app_error('forbidden', 'Bu rol bilan taklif qilishga ruxsat yo''q', '42501');
  end if;

  select status into v_status from public.restaurants where id = p_restaurant_id;
  if v_status = 'suspended' then
    perform private.raise_app_error('restaurant_suspended', 'Restoran vaqtincha to''xtatilgan');
  end if;

  if p_phone is null or p_phone !~ '^\+998[0-9]{9}$' then
    perform private.raise_app_error('invalid_phone', 'Telefon raqami noto''g''ri', '22023');
  end if;

  if exists (
    select 1 from public.staff_members as sm
    join public.profiles as p on p.id = sm.user_id
    where sm.restaurant_id = p_restaurant_id and sm.is_active and p.phone = p_phone
  ) then
    perform private.raise_app_error('already_member', 'Bu raqam egasi allaqachon jamoada');
  end if;

  -- Muddati o'tgan eski taklif yangisiga xalaqit bermasin
  update public.staff_invitations
  set status = 'expired'
  where restaurant_id = p_restaurant_id and phone = p_phone
    and status = 'pending' and expires_at <= now();

  if exists (
    select 1 from public.staff_invitations
    where restaurant_id = p_restaurant_id and phone = p_phone and status = 'pending'
  ) then
    perform private.raise_app_error('already_invited', 'Bu raqamga taklif allaqachon yuborilgan');
  end if;

  insert into public.staff_invitations (restaurant_id, phone, role, invited_by)
  values (p_restaurant_id, p_phone, p_role, v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.revoke_staff_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.staff_invitations;
  v_actor public.staff_role;
begin
  perform private.require_uid();
  select * into v_inv from public.staff_invitations where id = p_invitation_id;
  v_actor := private.my_restaurant_role(v_inv.restaurant_id);

  if v_inv.id is null or v_actor is null or not private.can_manage_role(v_actor, v_inv.role) then
    perform private.raise_app_error('forbidden', 'Bu taklifni bekor qilishga ruxsat yo''q', '42501');
  end if;
  if v_inv.status <> 'pending' then
    perform private.raise_app_error('invitation_not_pending', 'Taklif allaqachon yopilgan');
  end if;

  update public.staff_invitations set status = 'revoked' where id = p_invitation_id;
end;
$$;

create or replace function public.my_staff_invitations()
returns table (
  id uuid,
  restaurant_id uuid,
  restaurant_name jsonb,
  role public.staff_role,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.restaurant_id, r.name, i.role, i.expires_at, i.created_at
  from public.staff_invitations as i
  join public.restaurants as r on r.id = i.restaurant_id
  where i.status = 'pending'
    and i.expires_at > now()
    and i.phone = private.my_phone()
    and r.status <> 'suspended'
  order by i.created_at desc;
$$;

create or replace function public.accept_staff_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_inv public.staff_invitations;
  v_existing public.staff_members;
begin
  select * into v_inv from public.staff_invitations
  where id = p_invitation_id
  for update;

  -- Boshqa raqamga yuborilgan taklif "topilmadi" deb ko'rsatiladi (borligini oshkor qilmaymiz)
  if v_inv.id is null or v_inv.phone is distinct from private.my_phone() then
    perform private.raise_app_error('invitation_not_found', 'Taklif topilmadi', 'P0002');
  end if;
  if v_inv.status <> 'pending' then
    perform private.raise_app_error('invitation_not_pending', 'Taklif allaqachon yopilgan');
  end if;
  -- Xato tranzaksiyani bekor qiladi, shuning uchun bu yerda holatni yozmaymiz:
  -- muddati o'tgan taklifni invite_staff yopadi, ro'yxatlar esa expires_at bo'yicha filtrlaydi.
  if v_inv.expires_at <= now() then
    perform private.raise_app_error('invitation_expired', 'Taklif muddati o''tgan');
  end if;
  if exists (select 1 from public.restaurants where id = v_inv.restaurant_id and status = 'suspended') then
    perform private.raise_app_error('restaurant_suspended', 'Restoran vaqtincha to''xtatilgan');
  end if;

  select * into v_existing from public.staff_members
  where restaurant_id = v_inv.restaurant_id and user_id = v_uid
  for update;

  if v_existing.user_id is not null and v_existing.is_active then
    perform private.raise_app_error('already_member', 'Siz allaqachon shu restoran jamoasidasiz');
  elsif v_existing.user_id is not null then
    update public.staff_members
    set role = v_inv.role, is_active = true, invited_by = v_inv.invited_by
    where restaurant_id = v_inv.restaurant_id and user_id = v_uid;
  else
    insert into public.staff_members (restaurant_id, user_id, role, invited_by)
    values (v_inv.restaurant_id, v_uid, v_inv.role, v_inv.invited_by);
  end if;

  update public.staff_invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;

  return v_inv.restaurant_id;
end;
$$;

create or replace function public.decline_staff_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.staff_invitations;
begin
  perform private.require_uid();
  select * into v_inv from public.staff_invitations where id = p_invitation_id for update;

  if v_inv.id is null or v_inv.phone is distinct from private.my_phone() then
    perform private.raise_app_error('invitation_not_found', 'Taklif topilmadi', 'P0002');
  end if;
  if v_inv.status <> 'pending' then
    perform private.raise_app_error('invitation_not_pending', 'Taklif allaqachon yopilgan');
  end if;

  update public.staff_invitations set status = 'declined' where id = v_inv.id;
end;
$$;

create or replace function public.set_staff_member_role(p_restaurant_id uuid, p_user_id uuid, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_target public.staff_members;
begin
  -- Rollarni faqat owner o'zgartiradi
  if private.my_restaurant_role(p_restaurant_id) is distinct from 'owner' then
    perform private.raise_app_error('forbidden', 'Rolni faqat restoran egasi o''zgartiradi', '42501');
  end if;
  if p_user_id = v_uid then
    perform private.raise_app_error('cannot_change_self', 'O''z rolingizni o''zgartira olmaysiz');
  end if;

  select * into v_target from public.staff_members
  where restaurant_id = p_restaurant_id and user_id = p_user_id
  for update;
  if v_target.user_id is null then
    perform private.raise_app_error('member_not_found', 'Xodim topilmadi', 'P0002');
  end if;

  update public.staff_members set role = p_role
  where restaurant_id = p_restaurant_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_staff_member_active(p_restaurant_id uuid, p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_actor public.staff_role := private.my_restaurant_role(p_restaurant_id);
  v_target public.staff_members;
begin
  if p_user_id = v_uid then
    perform private.raise_app_error('cannot_change_self', 'O''zingizni o''chira olmaysiz');
  end if;

  select * into v_target from public.staff_members
  where restaurant_id = p_restaurant_id and user_id = p_user_id
  for update;

  if v_actor is null or v_target.user_id is null or not private.can_manage_role(v_actor, v_target.role) then
    perform private.raise_app_error('forbidden', 'Bu xodimni boshqarishga ruxsat yo''q', '42501');
  end if;

  update public.staff_members set is_active = coalesce(p_active, false)
  where restaurant_id = p_restaurant_id and user_id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Super Admin: umumiy raqamlar (faqat bazadagi haqiqiy son)
-- ---------------------------------------------------------------------------

create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_uid();
  if not private.is_super_admin() then
    perform private.raise_app_error('forbidden', 'Faqat platforma administratori uchun', '42501');
  end if;

  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'restaurants', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.restaurants group by status) as s
    ),
    'reservations_upcoming', (
      select count(*) from public.reservations
      where starts_at >= now() and private.is_blocking_status(status)
    ),
    'media_pending_review', (select count(*) from public.restaurant_media where status = 'pending_review')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Ruxsatlar: ilova faqat kirgan foydalanuvchi nomidan chaqiradi
-- ---------------------------------------------------------------------------

revoke all on function public.complete_onboarding(text, text) from public, anon;
revoke all on function public.get_my_access() from public, anon;
revoke all on function public.get_restaurant_staff(uuid) from public, anon;
revoke all on function public.invite_staff(uuid, text, public.staff_role) from public, anon;
revoke all on function public.revoke_staff_invitation(uuid) from public, anon;
revoke all on function public.my_staff_invitations() from public, anon;
revoke all on function public.accept_staff_invitation(uuid) from public, anon;
revoke all on function public.decline_staff_invitation(uuid) from public, anon;
revoke all on function public.set_staff_member_role(uuid, uuid, public.staff_role) from public, anon;
revoke all on function public.set_staff_member_active(uuid, uuid, boolean) from public, anon;
revoke all on function public.admin_overview() from public, anon;

grant execute on function public.complete_onboarding(text, text) to authenticated;
grant execute on function public.get_my_access() to authenticated;
grant execute on function public.get_restaurant_staff(uuid) to authenticated;
grant execute on function public.invite_staff(uuid, text, public.staff_role) to authenticated;
grant execute on function public.revoke_staff_invitation(uuid) to authenticated;
grant execute on function public.my_staff_invitations() to authenticated;
grant execute on function public.accept_staff_invitation(uuid) to authenticated;
grant execute on function public.decline_staff_invitation(uuid) to authenticated;
grant execute on function public.set_staff_member_role(uuid, uuid, public.staff_role) to authenticated;
grant execute on function public.set_staff_member_active(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_overview() to authenticated;
