-- SOFRIVA: bronlar va stol bandligi.
--
-- Asosiy kafolat: bitta stolda bir vaqt oralig'ida ikkita faol bandlik bo'lmaydi.
-- Har bir band oraliq (bron yoki vaqtincha yopish) `table_allocations` jadvalida alohida qator,
-- exclusion constraint kesishgan faol oraliqlarni baza darajasida rad etadi.
-- Bronlarni yaratish/o'zgartirish keyinchalik faqat baza funksiyalari orqali (Sprint 7).

-- ---------------------------------------------------------------------------
-- Holatlar mantiqi (src/lib/booking/statuses.ts bilan bir xil)
-- ---------------------------------------------------------------------------

create or replace function private.is_blocking_status(p_status public.reservation_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('pending', 'awaiting_payment', 'confirmed', 'checked_in');
$$;

create or replace function private.can_transition(p_from public.reservation_status, p_to public.reservation_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending' then p_to in ('awaiting_payment', 'confirmed', 'rejected', 'cancelled', 'expired')
    when 'awaiting_payment' then p_to in ('confirmed', 'cancelled', 'expired')
    when 'confirmed' then p_to in ('checked_in', 'cancelled', 'no_show')
    when 'checked_in' then p_to in ('completed')
    else false
  end;
$$;

-- Ommaviy bron kodi: 8 belgi, adashtiradigan belgilarsiz (0/O, 1/I/L yo'q)
create or replace function private.generate_reservation_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bronlar
-- ---------------------------------------------------------------------------

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default private.generate_reservation_code(),
  restaurant_id uuid not null,
  branch_id uuid not null,
  hall_id uuid,
  customer_id uuid references auth.users (id) on delete set null,
  party_size smallint not null check (party_size between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.reservation_status not null default 'pending',
  source public.reservation_source not null,
  special_requests text check (special_requests is null or char_length(special_requests) <= 500),
  idempotency_key uuid,
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid,
  status_reason text check (status_reason is null or char_length(status_reason) <= 500),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '12 hours'),
  unique (id, restaurant_id),
  unique (customer_id, idempotency_key),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id),
  foreign key (hall_id, branch_id, restaurant_id) references public.restaurant_halls (id, branch_id, restaurant_id)
);
alter table public.reservations enable row level security;
create index reservations_branch_time_idx on public.reservations (branch_id, restaurant_id, starts_at);
create index reservations_hall_fk on public.reservations (hall_id, branch_id, restaurant_id) where hall_id is not null;
create index reservations_customer_idx on public.reservations (customer_id, starts_at desc) where customer_id is not null;
create index reservations_pending_hold_idx on public.reservations (hold_expires_at) where status in ('pending', 'awaiting_payment');
comment on table public.reservations is 'Bron. Yaratish va holatni o''zgartirish faqat baza funksiyalari orqali (Sprint 7).';
comment on column public.reservations.code is 'Mijozga ko''rsatiladigan qisqa kod (8 belgi).';
comment on column public.reservations.hold_expires_at is 'Tasdiq yoki to''lov kutilayotgan bron shu vaqtgacha stolni ushlab turadi.';

create table public.reservation_guests (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null,
  restaurant_id uuid not null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  phone text check (phone is null or private.is_e164(phone)),
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (reservation_id, restaurant_id) references public.reservations (id, restaurant_id) on delete cascade
);
alter table public.reservation_guests enable row level security;
create index reservation_guests_reservation_fk on public.reservation_guests (reservation_id, restaurant_id);
create unique index reservation_guests_one_primary on public.reservation_guests (reservation_id) where is_primary;
comment on table public.reservation_guests is 'Bron kimning nomiga: ism va telefon (mijoz o''zi yoki host kiritgan mehmon).';

create table public.table_allocations (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null,
  branch_id uuid not null,
  table_id uuid not null,
  reservation_id uuid,
  kind public.allocation_kind not null,
  period tstzrange not null,
  active boolean not null default true,
  reason text check (reason is null or char_length(reason) <= 200),
  created_by uuid,
  created_at timestamptz not null default now(),
  check (not isempty(period) and not lower_inf(period) and not upper_inf(period)),
  check ((kind = 'reservation') = (reservation_id is not null)),
  foreign key (table_id, branch_id, restaurant_id)
    references public.restaurant_tables (id, branch_id, restaurant_id),
  foreign key (reservation_id, restaurant_id)
    references public.reservations (id, restaurant_id) on delete cascade,
  constraint table_allocations_no_overlap
    exclude using gist (table_id with =, period with &&) where (active)
);
alter table public.table_allocations enable row level security;
create index table_allocations_branch_period_idx on public.table_allocations using gist (branch_id, period) where active;
create index table_allocations_reservation_fk on public.table_allocations (reservation_id, restaurant_id) where reservation_id is not null;
create index table_allocations_table_fk on public.table_allocations (table_id, branch_id, restaurant_id);
comment on table public.table_allocations is 'Stolning band oraliqlari: bron yoki vaqtincha yopish. Kesishgan faol oraliqlarni baza rad etadi.';
comment on constraint table_allocations_no_overlap on public.table_allocations is 'Ikki marta bronni baza darajasida to''xtatadi.';

create table public.reservation_status_history (
  id bigint generated always as identity primary key,
  reservation_id uuid not null,
  restaurant_id uuid not null,
  from_status public.reservation_status,
  to_status public.reservation_status not null,
  changed_by uuid,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  foreign key (reservation_id, restaurant_id) references public.reservations (id, restaurant_id) on delete cascade
);
alter table public.reservation_status_history enable row level security;
create index reservation_status_history_reservation_fk
  on public.reservation_status_history (reservation_id, restaurant_id, created_at);

-- ---------------------------------------------------------------------------
-- Triggerlar
-- ---------------------------------------------------------------------------

-- Holat o'tishini tekshirish va vaqt belgilarini qo'yish
create or replace function private.reservation_status_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status_changed boolean := true;
begin
  if tg_op = 'INSERT' then
    if not private.is_blocking_status(new.status) then
      raise exception using
        errcode = 'P0001',
        message = format('Yangi bron %s holatida yaratilmaydi', new.status),
        detail = 'invalid_initial_status';
    end if;
  else
    v_status_changed := new.status is distinct from old.status;
    if v_status_changed and not private.can_transition(old.status, new.status) then
      raise exception using
        errcode = 'P0001',
        message = format('Bron holatini %s dan %s ga o''zgartirib bo''lmaydi', old.status, new.status),
        detail = 'invalid_status_transition';
    end if;
  end if;

  if v_status_changed then
    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'checked_in' then
        new.confirmed_at := coalesce(new.confirmed_at, now());
        new.checked_in_at := coalesce(new.checked_in_at, now());
      when 'completed' then new.completed_at := coalesce(new.completed_at, now());
      when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;

    if new.status not in ('pending', 'awaiting_payment') then
      new.hold_expires_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger reservations_status_guard
before insert or update on public.reservations
for each row execute function private.reservation_status_guard();

create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function private.set_updated_at();

-- Holat tarixini yozish va yakuniy holatda stolni bo'shatish
create or replace function private.reservation_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.reservation_status;
begin
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return null;
    end if;
    v_from := old.status;
  end if;

  insert into public.reservation_status_history (reservation_id, restaurant_id, from_status, to_status, changed_by, reason)
  values (new.id, new.restaurant_id, v_from, new.status, (select auth.uid()), new.status_reason);

  if tg_op = 'UPDATE' and not private.is_blocking_status(new.status) then
    update public.table_allocations
    set active = false
    where reservation_id = new.id and active;
  end if;

  return null;
end;
$$;

create trigger reservations_after_status_change
after insert or update of status on public.reservations
for each row execute function private.reservation_after_status_change();

-- Bandlik qatori bronning filialiga mos va bron faol bo'lishi shart
create or replace function private.table_allocation_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if new.reservation_id is not null and new.active then
    select * into v_reservation from public.reservations where id = new.reservation_id;
    if v_reservation.branch_id <> new.branch_id then
      raise exception using errcode = 'P0001', message = 'Stol bron qilingan filialga tegishli emas', detail = 'branch_mismatch';
    end if;
    if not private.is_blocking_status(v_reservation.status) then
      raise exception using errcode = 'P0001', message = 'Yakunlangan bron uchun stol band qilinmaydi', detail = 'reservation_not_active';
    end if;
  end if;
  return new;
end;
$$;

create trigger table_allocations_guard
before insert or update on public.table_allocations
for each row execute function private.table_allocation_guard();
