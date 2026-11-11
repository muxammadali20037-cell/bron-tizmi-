-- SOFRIVA: poydevor — private sxema, enum turlari, umumiy tekshiruv funksiyalari, kataloglar.
--
-- `private` sxemasi Data API orqali ochilmaydi. RLS siyosatlari ishlatadigan yordamchi
-- funksiyalar shu yerda turadi: ularni brauzerdan RPC qilib chaqirib bo'lmaydi.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Yangi jadval va funksiyalar avtomatik ravishda anon/authenticated'ga ochilmasin:
-- har bir jadval uchun ruxsat RLS migratsiyasida aniq yoziladi.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enum turlari
-- ---------------------------------------------------------------------------

create type public.restaurant_status as enum ('draft', 'pending_review', 'published', 'rejected', 'suspended');
create type public.staff_role as enum ('owner', 'manager', 'host', 'staff');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.hall_type as enum ('main', 'vip', 'family', 'terrace', 'banquet', 'private', 'kids');
create type public.table_shape as enum ('round', 'square', 'rectangle');
create type public.table_feature as enum (
  'window', 'sofa', 'quiet_zone', 'smoking_area', 'outdoor', 'wheelchair_accessible', 'near_kids_area', 'stage_view'
);
create type public.media_kind as enum ('photo', 'video');
create type public.media_status as enum ('pending_review', 'approved', 'rejected');
create type public.confirmation_mode as enum ('auto', 'manual');
create type public.reservation_status as enum (
  'pending', 'awaiting_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'rejected', 'expired', 'no_show'
);
create type public.reservation_source as enum (
  'sofriva', 'direct_link', 'qr', 'phone', 'walk_in', 'instagram', 'telegram', 'widget', 'other'
);
create type public.allocation_kind as enum ('reservation', 'block');
create type public.notification_channel as enum ('telegram', 'in_app');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Umumiy funksiyalar
-- ---------------------------------------------------------------------------

-- updated_at ustunini avtomatik yangilash
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Ko'p tilli matn: {"uz": "...", "ru": "...", "en": "..."}.
-- Faqat uz/ru/en kalitlari, qiymatlar matn, uzunligi chegaralangan; `required` kalitlar bo'sh bo'lmasligi shart.
create or replace function private.is_i18n_text(value jsonb, required text[] default '{}', max_length integer default 2000)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as e(key, val)
      where e.key not in ('uz', 'ru', 'en')
        or jsonb_typeof(e.val) <> 'string'
        or char_length(e.val #>> '{}') > max_length
    )
    and not exists (
      select 1
      from unnest(required) as r(key)
      where coalesce(btrim(value ->> r.key), '') = ''
    );
$$;

-- Xalqaro telefon raqami (E.164): "+998901234567"
create or replace function private.is_e164(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~ '^\+[1-9][0-9]{7,14}$';
$$;

-- ---------------------------------------------------------------------------
-- Kataloglar (ma'lumotnoma jadvallari, admin boshqaradi)
-- ---------------------------------------------------------------------------

create table public.districts (
  code text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  city text not null default 'tashkent' check (city ~ '^[a-z0-9_]{2,40}$'),
  name jsonb not null check (private.is_i18n_text(name, array['uz', 'ru', 'en'], 80)),
  sort_order smallint not null default 0
);
alter table public.districts enable row level security;
comment on table public.districts is 'Shahar tumanlari katalogi (Toshkent: 12 tuman).';

create table public.cuisines (
  code text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  name jsonb not null check (private.is_i18n_text(name, array['uz', 'ru', 'en'], 80)),
  sort_order smallint not null default 0
);
alter table public.cuisines enable row level security;
comment on table public.cuisines is 'Oshxona turlari katalogi.';

create table public.facility_types (
  code text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  name jsonb not null check (private.is_i18n_text(name, array['uz', 'ru', 'en'], 80)),
  icon text not null check (icon ~ '^[a-z0-9-]{2,40}$'),
  has_details boolean not null default false,
  sort_order smallint not null default 0
);
alter table public.facility_types enable row level security;
comment on table public.facility_types is 'Qulayliklar katalogi. has_details — qo''shimcha ma''lumot so''raladi (masalan, bolalar maydonchasi).';
comment on column public.facility_types.icon is 'Lucide belgisi nomi (kebab-case).';
