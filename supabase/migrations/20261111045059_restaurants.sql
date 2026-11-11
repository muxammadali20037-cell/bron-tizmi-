-- SOFRIVA: restoranlar, filiallar, xodimlar, zallar, stollar, media va sozlamalar.
--
-- Tenant izolyatsiyasi: har bir bola jadvalda `restaurant_id` bor va u composite foreign key
-- orqali ota jadval bilan mos kelishga majbur. Shuning uchun RLS siyosati faqat shu ustunga
-- qaraydi (join'siz), va bir restoranning stoli boshqa restoranning zaliga "ulanib" qololmaydi.

-- ---------------------------------------------------------------------------
-- Restoran (brend) va filial
-- ---------------------------------------------------------------------------

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (char_length(slug) between 3 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (private.is_i18n_text(name, array['uz', 'ru'], 120)),
  description jsonb not null default '{}' check (private.is_i18n_text(description, '{}', 3000)),
  status public.restaurant_status not null default 'draft',
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.restaurants enable row level security;
create index restaurants_status_idx on public.restaurants (status);
comment on column public.restaurants.status is 'draft → pending_review → published | rejected; suspended — admin tomonidan to''xtatilgan.';

create table public.restaurant_branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name jsonb not null default '{}' check (private.is_i18n_text(name, '{}', 120)),
  address jsonb not null default '{}' check (private.is_i18n_text(address, '{}', 300)),
  district_code text references public.districts (code),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  phone text check (phone is null or private.is_e164(phone)),
  price_level smallint check (price_level between 1 and 4),
  timezone text not null default 'Asia/Tashkent' check (char_length(timezone) between 3 and 60),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, restaurant_id),
  check ((latitude is null) = (longitude is null))
);
alter table public.restaurant_branches enable row level security;
create index restaurant_branches_restaurant_idx on public.restaurant_branches (restaurant_id);
create index restaurant_branches_district_idx on public.restaurant_branches (district_code);
create unique index restaurant_branches_one_primary on public.restaurant_branches (restaurant_id) where is_primary;
comment on table public.restaurant_branches is 'Filial (bron qilinadigan joy). MVP''da har restoranda bitta filial.';

-- ---------------------------------------------------------------------------
-- Xodimlar va takliflar
-- ---------------------------------------------------------------------------

create table public.staff_members (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.staff_role not null,
  is_active boolean not null default true,
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
alter table public.staff_members enable row level security;
create index staff_members_user_idx on public.staff_members (user_id) where is_active;

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  phone text not null check (private.is_e164(phone)),
  role public.staff_role not null check (role <> 'owner'),
  status public.invitation_status not null default 'pending',
  invited_by uuid,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff_invitations enable row level security;
create unique index staff_invitations_one_pending on public.staff_invitations (restaurant_id, phone) where status = 'pending';
create index staff_invitations_phone_idx on public.staff_invitations (phone) where status = 'pending';
comment on table public.staff_invitations is 'Xodimni telefon raqami bo''yicha taklif qilish; o''sha raqam bilan kirgan foydalanuvchi qabul qiladi.';

-- RLS yordamchilari (security definer: staff_members siyosatida o'z-o'zini chaqirish bo'lmasin)
create or replace function private.has_restaurant_role(p_restaurant_id uuid, p_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where restaurant_id = p_restaurant_id
      and user_id = (select auth.uid())
      and is_active
      and role = any (p_roles)
  );
$$;

create or replace function private.is_restaurant_member(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where restaurant_id = p_restaurant_id
      and user_id = (select auth.uid())
      and is_active
  );
$$;

create or replace function private.is_restaurant_public(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants where id = p_restaurant_id and status = 'published'
  );
$$;

-- Restoranda kamida bitta faol egasi qolishi shart (restoranning o'zi o'chirilayotgan holatdan tashqari)
create or replace function private.ensure_restaurant_has_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_leaves_owner_role boolean;
begin
  if tg_op = 'DELETE' then
    v_leaves_owner_role := true;
  else
    v_leaves_owner_role := new.role <> 'owner' or not new.is_active or new.restaurant_id <> old.restaurant_id;
  end if;

  if old.role = 'owner' and old.is_active
     and v_leaves_owner_role
     and exists (select 1 from public.restaurants where id = old.restaurant_id)
     and not exists (
       select 1 from public.staff_members
       where restaurant_id = old.restaurant_id
         and user_id <> old.user_id
         and role = 'owner'
         and is_active
     )
  then
    raise exception using
      errcode = 'P0001',
      message = 'Restoranning oxirgi egasini olib tashlab bo''lmaydi',
      detail = 'last_owner';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger staff_members_keep_owner
before update or delete on public.staff_members
for each row execute function private.ensure_restaurant_has_owner();

-- ---------------------------------------------------------------------------
-- Filial sozlamalari: oshxona, qulayliklar, ish vaqti, bron qoidalari
-- ---------------------------------------------------------------------------

create table public.restaurant_cuisines (
  restaurant_id uuid not null,
  branch_id uuid not null,
  cuisine_code text not null references public.cuisines (code),
  primary key (branch_id, cuisine_code),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.restaurant_cuisines enable row level security;
create index restaurant_cuisines_branch_fk on public.restaurant_cuisines (branch_id, restaurant_id);
create index restaurant_cuisines_cuisine_idx on public.restaurant_cuisines (cuisine_code);

create table public.restaurant_facilities (
  restaurant_id uuid not null,
  branch_id uuid not null,
  facility_code text not null references public.facility_types (code),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object' and pg_column_size(details) <= 4000),
  primary key (branch_id, facility_code),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.restaurant_facilities enable row level security;
create index restaurant_facilities_branch_fk on public.restaurant_facilities (branch_id, restaurant_id);
create index restaurant_facilities_facility_idx on public.restaurant_facilities (facility_code);
comment on column public.restaurant_facilities.details is 'Qo''shimcha ma''lumot, masalan bolalar maydonchasi: ish vaqti, yosh chegarasi, xavfsizlik shartlari (ilovada Zod bilan tekshiriladi).';

create table public.opening_hours (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null,
  branch_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null,
  unique (branch_id, weekday, opens_at),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.opening_hours enable row level security;
create index opening_hours_branch_fk on public.opening_hours (branch_id, restaurant_id);
comment on column public.opening_hours.weekday is 'ISO: 1 — dushanba, 7 — yakshanba.';
comment on column public.opening_hours.closes_at is 'opens_at dan kichik yoki teng bo''lsa — yarim tundan keyin yopiladi.';

create table public.opening_hour_exceptions (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null,
  branch_id uuid not null,
  date date not null,
  is_closed boolean not null,
  opens_at time,
  closes_at time,
  note jsonb not null default '{}' check (private.is_i18n_text(note, '{}', 200)),
  unique (branch_id, date),
  check (
    (is_closed and opens_at is null and closes_at is null)
    or (not is_closed and opens_at is not null and closes_at is not null)
  ),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.opening_hour_exceptions enable row level security;
create index opening_hour_exceptions_branch_fk on public.opening_hour_exceptions (branch_id, restaurant_id);

create table public.booking_rules (
  branch_id uuid primary key,
  restaurant_id uuid not null,
  slot_interval_minutes smallint not null default 30 check (slot_interval_minutes in (15, 30, 60)),
  default_duration_minutes smallint not null default 120 check (default_duration_minutes between 30 and 480),
  min_lead_minutes integer not null default 60 check (min_lead_minutes between 0 and 10080),
  max_advance_days smallint not null default 30 check (max_advance_days between 1 and 365),
  min_party_size smallint not null default 1 check (min_party_size >= 1),
  max_party_size smallint not null default 12 check (max_party_size between 1 and 100),
  confirmation_mode public.confirmation_mode not null default 'auto',
  pending_hold_minutes smallint not null default 30 check (pending_hold_minutes between 5 and 1440),
  guest_can_choose_table boolean not null default true,
  cancellation_cutoff_minutes integer not null default 120 check (cancellation_cutoff_minutes between 0 and 10080),
  last_seating_before_close_minutes smallint not null default 60 check (last_seating_before_close_minutes between 0 and 480),
  max_active_reservations_per_guest smallint not null default 3 check (max_active_reservations_per_guest between 1 and 20),
  updated_at timestamptz not null default now(),
  check (max_party_size >= min_party_size),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.booking_rules enable row level security;
create index booking_rules_branch_fk on public.booking_rules (branch_id, restaurant_id);
comment on table public.booking_rules is 'Filial bron qoidalari. Filial yaratilganda standart qiymatlar bilan avtomatik yaratiladi.';

create or replace function private.create_default_booking_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_rules (branch_id, restaurant_id)
  values (new.id, new.restaurant_id)
  on conflict (branch_id) do nothing;
  return new;
end;
$$;

create trigger restaurant_branches_default_rules
after insert on public.restaurant_branches
for each row execute function private.create_default_booking_rules();

-- ---------------------------------------------------------------------------
-- Zallar va stollar
-- ---------------------------------------------------------------------------

create table public.restaurant_halls (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  branch_id uuid not null,
  name jsonb not null check (private.is_i18n_text(name, array['uz', 'ru'], 80)),
  hall_type public.hall_type not null default 'main',
  description jsonb not null default '{}' check (private.is_i18n_text(description, '{}', 1000)),
  restrictions jsonb not null default '{}' check (private.is_i18n_text(restrictions, '{}', 300)),
  capacity smallint check (capacity between 1 and 2000),
  plan_width smallint not null default 1000 check (plan_width between 100 and 5000),
  plan_height smallint not null default 1000 check (plan_height between 100 and 5000),
  background_media_id uuid,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, branch_id, restaurant_id),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade
);
alter table public.restaurant_halls enable row level security;
create index restaurant_halls_branch_fk on public.restaurant_halls (branch_id, restaurant_id);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  branch_id uuid not null,
  hall_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 20),
  min_party smallint not null default 1 check (min_party >= 1),
  max_party smallint not null check (max_party between 1 and 50),
  shape public.table_shape not null default 'square',
  pos_x numeric(7, 2) not null default 0 check (pos_x between 0 and 5000),
  pos_y numeric(7, 2) not null default 0 check (pos_y between 0 and 5000),
  width numeric(7, 2) not null default 60 check (width between 10 and 1000),
  height numeric(7, 2) not null default 60 check (height between 10 and 1000),
  rotation smallint not null default 0 check (rotation in (0, 90, 180, 270)),
  is_active boolean not null default true,
  is_online_bookable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_party >= min_party),
  unique (hall_id, label),
  unique (id, restaurant_id),
  unique (id, branch_id, restaurant_id),
  foreign key (hall_id, branch_id, restaurant_id)
    references public.restaurant_halls (id, branch_id, restaurant_id) on delete cascade
);
alter table public.restaurant_tables enable row level security;
create index restaurant_tables_hall_fk on public.restaurant_tables (hall_id, branch_id, restaurant_id);
create index restaurant_tables_branch_idx on public.restaurant_tables (branch_id) where is_active;
comment on column public.restaurant_tables.pos_x is 'Zal rejasidagi joylashuv (zal o''lchamiga nisbatan, standart 0–1000).';

create table public.table_features (
  restaurant_id uuid not null,
  table_id uuid not null,
  feature public.table_feature not null,
  primary key (table_id, feature),
  foreign key (table_id, restaurant_id) references public.restaurant_tables (id, restaurant_id) on delete cascade
);
alter table public.table_features enable row level security;
create index table_features_table_fk on public.table_features (table_id, restaurant_id);

-- ---------------------------------------------------------------------------
-- Media (rasm va video)
-- ---------------------------------------------------------------------------

create table public.restaurant_media (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  branch_id uuid not null,
  hall_id uuid,
  facility_code text references public.facility_types (code),
  kind public.media_kind not null,
  storage_path text check (storage_path is null or char_length(storage_path) between 3 and 500),
  stream_uid text check (stream_uid is null or stream_uid ~ '^[A-Za-z0-9_-]{8,64}$'),
  poster_path text check (poster_path is null or char_length(poster_path) between 3 and 500),
  width integer check (width between 1 and 20000),
  height integer check (height between 1 and 20000),
  duration_seconds numeric(6, 1) check (duration_seconds between 0 and 3600),
  alt jsonb not null default '{}' check (private.is_i18n_text(alt, '{}', 200)),
  sort_order smallint not null default 0,
  status public.media_status not null default 'pending_review',
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  rights_confirmed boolean not null check (rights_confirmed),
  uploaded_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'photo' and storage_path is not null and stream_uid is null)
    or (kind = 'video' and stream_uid is not null and storage_path is null)
  ),
  unique (id, restaurant_id),
  foreign key (branch_id, restaurant_id) references public.restaurant_branches (id, restaurant_id) on delete cascade,
  foreign key (hall_id, branch_id, restaurant_id)
    references public.restaurant_halls (id, branch_id, restaurant_id) on delete cascade
);
alter table public.restaurant_media enable row level security;
create index restaurant_media_branch_fk on public.restaurant_media (branch_id, restaurant_id, sort_order);
create index restaurant_media_hall_fk on public.restaurant_media (hall_id, branch_id, restaurant_id) where hall_id is not null;
create index restaurant_media_facility_idx on public.restaurant_media (facility_code) where facility_code is not null;
create index restaurant_media_review_idx on public.restaurant_media (created_at) where status = 'pending_review';
comment on column public.restaurant_media.rights_confirmed is 'Yuklagan xodim rasm/videodan foydalanish huquqi borligini tasdiqlagan.';
comment on column public.restaurant_media.stream_uid is 'Cloudflare Stream video identifikatori (ADR 0005).';

-- Zal rejasining fon rasmi: faqat o'sha restoranning mediasi bo'lishi mumkin
alter table public.restaurant_halls
  add constraint restaurant_halls_background_media_fk
  foreign key (background_media_id, restaurant_id)
  references public.restaurant_media (id, restaurant_id)
  on delete set null (background_media_id);
create index restaurant_halls_background_fk on public.restaurant_halls (background_media_id, restaurant_id)
  where background_media_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at triggerlari
-- ---------------------------------------------------------------------------

create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function private.set_updated_at();
create trigger restaurant_branches_set_updated_at before update on public.restaurant_branches
for each row execute function private.set_updated_at();
create trigger staff_members_set_updated_at before update on public.staff_members
for each row execute function private.set_updated_at();
create trigger staff_invitations_set_updated_at before update on public.staff_invitations
for each row execute function private.set_updated_at();
create trigger booking_rules_set_updated_at before update on public.booking_rules
for each row execute function private.set_updated_at();
create trigger restaurant_halls_set_updated_at before update on public.restaurant_halls
for each row execute function private.set_updated_at();
create trigger restaurant_tables_set_updated_at before update on public.restaurant_tables
for each row execute function private.set_updated_at();
create trigger restaurant_media_set_updated_at before update on public.restaurant_media
for each row execute function private.set_updated_at();
