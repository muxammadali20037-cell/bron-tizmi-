-- Sxema tekshiruvi: RLS hamma jadvalda yoqiq, asosiy himoyalar joyida, kataloglar to'liq.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'public sxemadagi har bir jadvalda RLS yoqilgan'
);

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'),
  25,
  'MVP jadvallari soni: 25'
);

select ok(
  exists (select 1 from pg_constraint where conname = 'table_allocations_no_overlap' and contype = 'x'),
  'Stol bandligida exclusion constraint bor'
);

select ok(
  not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ),
  'Mehmon (anon) hech qaysi jadvalga yoza olmaydi'
);

select ok(
  not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated'
      and table_name in ('reservations', 'table_allocations', 'reservation_guests', 'reservation_status_history',
                         'staff_members', 'staff_invitations', 'platform_admins', 'notifications', 'audit_logs')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ),
  'Bron, xodim, admin, navbat va jurnal jadvallariga to''g''ridan-to''g''ri yozib bo''lmaydi'
);

select ok(
  not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.prosecdef and not exists (
      select 1 from unnest(coalesce(p.proconfig, '{}')) as c where c like 'search_path=%'
    )
  ),
  'Har bir security definer funksiyada search_path qat''iy belgilangan'
);

select is(
  (select array_agg(c.relname::text order by c.relname)
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  null,
  'Har bir jadvalda kamida bitta aniq RLS siyosati bor (advisor 0008 toza)'
);

select is((select count(*)::int from public.districts where city = 'tashkent'), 12, 'Toshkentning 12 tumani katalogda');
select ok((select count(*) from public.cuisines) >= 10, 'Oshxona turlari katalogi to''ldirilgan');
select ok((select count(*) from public.facility_types) >= 10, 'Qulayliklar katalogi to''ldirilgan');

select * from finish();
rollback;
