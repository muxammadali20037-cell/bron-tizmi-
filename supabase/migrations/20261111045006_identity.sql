-- SOFRIVA: foydalanuvchi profili va platforma administratorlari.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(btrim(full_name)) between 1 and 100),
  phone text unique check (phone is null or private.is_e164(phone)),
  locale text not null default 'uz' check (locale in ('uz', 'ru', 'en')),
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
comment on table public.profiles is 'Foydalanuvchi profili. Telefon Supabase Auth''dan trigger orqali keladi, foydalanuvchi o''zi o''zgartira olmaydi.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- Super Admin'lar. Rol foydalanuvchi tahrirlay oladigan metadata'da emas, alohida jadvalda.
-- Bu jadvalga faqat migratsiya yoki service role orqali yoziladi.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;

-- Yangi foydalanuvchi ro'yxatdan o'tganda yoki telefoni o'zgarganda profilni yaratish/yangilash.
-- Telefon E.164 ko'rinishida saqlanadi; noto'g'ri bo'lsa, ro'yxatdan o'tish to'xtamaydi — telefon bo'sh qoladi.
create or replace function private.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := nullif('+' || ltrim(coalesce(new.phone, ''), '+'), '+');
begin
  if v_phone is not null and not private.is_e164(v_phone) then
    v_phone := null;
  end if;

  insert into public.profiles (id, phone)
  values (new.id, v_phone)
  on conflict (id) do update
    set phone = excluded.phone;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.sync_profile_from_auth();

create trigger on_auth_user_phone_changed
after update of phone on auth.users
for each row
when (old.phone is distinct from new.phone)
execute function private.sync_profile_from_auth();
