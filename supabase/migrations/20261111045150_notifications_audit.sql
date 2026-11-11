-- SOFRIVA: bildirishnomalar navbati, Telegram bog'lanishlari va audit log.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete cascade,
  recipient_user_id uuid references auth.users (id) on delete cascade,
  recipient_chat_id bigint,
  channel public.notification_channel not null,
  type text not null check (type ~ '^[a-z][a-z0-9_.]{2,60}$'),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  status public.notification_status not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 20),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  dedupe_key text unique check (dedupe_key is null or char_length(dedupe_key) <= 200),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index notifications_queue_idx on public.notifications (scheduled_at) where status = 'pending';
create index notifications_restaurant_fk on public.notifications (restaurant_id) where restaurant_id is not null;
create index notifications_reservation_fk on public.notifications (reservation_id) where reservation_id is not null;
create index notifications_recipient_fk on public.notifications (recipient_user_id) where recipient_user_id is not null;
comment on table public.notifications is 'Yuboriladigan xabarlar navbati. Faqat server (service role) o''qiydi va yozadi.';
comment on column public.notifications.dedupe_key is 'Bir xabar ikki marta yuborilmasligi uchun, masalan "reservation:<id>:confirmed:telegram".';

create table public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  chat_id bigint unique,
  link_code_hash text unique check (link_code_hash is null or char_length(link_code_hash) = 64),
  link_code_expires_at timestamptz,
  linked_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(user_id, restaurant_id) = 1)
);
alter table public.telegram_links enable row level security;
create index telegram_links_user_fk on public.telegram_links (user_id) where user_id is not null;
create index telegram_links_restaurant_fk on public.telegram_links (restaurant_id) where restaurant_id is not null;
comment on column public.telegram_links.link_code_hash is 'Bir martalik ulash kodining SHA-256 xeshi (kodning o''zi saqlanmaydi).';

create trigger telegram_links_set_updated_at before update on public.telegram_links
for each row execute function private.set_updated_at();

create table public.audit_logs (
  id bigint generated always as identity primary key,
  restaurant_id uuid,
  actor_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index audit_logs_restaurant_idx on public.audit_logs (restaurant_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
comment on table public.audit_logs is 'Muhim o''zgarishlar jurnali. Faqat trigger yozadi; hech kim tahrirlay olmaydi.';

-- Umumiy audit triggeri. updated_at'dan boshqa hech narsa o'zgarmagan bo'lsa, yozmaydi.
create or replace function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_restaurant uuid;
  v_entity_id text;
begin
  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then
    return null;
  end if;

  if tg_table_name = 'restaurants' then
    v_restaurant := (v_row ->> 'id')::uuid;
  else
    v_restaurant := (v_row ->> 'restaurant_id')::uuid;
  end if;

  v_entity_id := coalesce(
    v_row ->> 'id',
    v_row ->> 'branch_id',
    case when v_row ? 'user_id' then concat_ws(':', v_row ->> 'restaurant_id', v_row ->> 'user_id') end
  );

  insert into public.audit_logs (restaurant_id, actor_id, action, entity, entity_id, before, after)
  values (v_restaurant, (select auth.uid()), lower(tg_op), tg_table_name, v_entity_id, v_old, v_new);

  return null;
end;
$$;

create trigger restaurants_audit after insert or update or delete on public.restaurants
for each row execute function private.audit_row();
create trigger restaurant_branches_audit after insert or update or delete on public.restaurant_branches
for each row execute function private.audit_row();
create trigger staff_members_audit after insert or update or delete on public.staff_members
for each row execute function private.audit_row();
create trigger staff_invitations_audit after insert or update or delete on public.staff_invitations
for each row execute function private.audit_row();
create trigger booking_rules_audit after insert or update or delete on public.booking_rules
for each row execute function private.audit_row();
create trigger restaurant_media_audit after insert or update or delete on public.restaurant_media
for each row execute function private.audit_row();
create trigger platform_admins_audit after insert or update or delete on public.platform_admins
for each row execute function private.audit_row();
