-- RLS: kim nimani ko'radi va o'zgartira oladi.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
\ir _fixtures.psql

-- ---------------------------------------------------------------- Mehmon (anon)
set local role anon;
select set_config('request.jwt.claims', '', true);

select is((select count(*)::int from public.restaurants), 1, 'Mehmon faqat nashr qilingan restoranni ko''radi');
select is((select slug from public.restaurants), 'test-a', 'Ko''ringan restoran — A');
select is((select count(*)::int from public.restaurant_tables), 2, 'Mehmon faqat A restoran stollarini ko''radi');
select is((select count(*)::int from public.booking_rules), 1, 'Mehmon faqat A bron qoidalarini ko''radi');
select is((select count(*)::int from public.districts), 12, 'Mehmon kataloglarni ko''radi');
select throws_ok('select * from public.reservations', '42501', null, 'Mehmon bronlarni o''qiy olmaydi');
select throws_ok('select * from public.profiles', '42501', null, 'Mehmon profillarni o''qiy olmaydi');
select throws_ok('select * from public.table_allocations', '42501', null, 'Mehmon stol bandligini o''qiy olmaydi');
select throws_ok($$update public.restaurants set name = '{"uz":"x","ru":"x"}'$$, '42501', null, 'Mehmon restoranni o''zgartira olmaydi');

reset role;

-- ---------------------------------------------------------------- Mijoz c1
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

select is((select count(*)::int from public.reservations), 1, 'Mijoz o''z bronini ko''radi');
select is((select count(*)::int from public.reservation_guests), 1, 'Mijoz o''z broni mehmon yozuvini ko''radi');
select is((select count(*)::int from public.table_allocations), 0, 'Mijoz stol bandligi jadvalini ko''rmaydi');
select is((select count(*)::int from public.profiles), 1, 'Mijoz faqat o''z profilini ko''radi');
select is((select phone from public.profiles), '+998901110006', 'Profil telefoni Auth''dan E.164 ko''rinishida keldi');
select throws_ok(
  $$insert into public.reservations (restaurant_id, branch_id, party_size, starts_at, ends_at, source)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 2, now() + interval '1 day', now() + interval '1 day 2 hours', 'sofriva')$$,
  '42501', null, 'Mijoz bronni to''g''ridan-to''g''ri yarata olmaydi (faqat funksiya orqali)'
);
select throws_ok($$update public.reservations set status = 'cancelled'$$, '42501', null, 'Mijoz bron holatini to''g''ridan-to''g''ri o''zgartira olmaydi');
select throws_ok($$update public.profiles set phone = '+998900000000'$$, '42501', null, 'Mijoz telefon raqamini o''zi o''zgartira olmaydi');
select lives_ok($$update public.profiles set full_name = 'Aziza'$$, 'Mijoz o''z ismini o''zgartiradi');
select throws_ok($$insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000c1')$$, '42501', null, 'Mijoz o''zini admin qila olmaydi');
select throws_ok($$insert into public.staff_members (restaurant_id, user_id, role) values ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000c1', 'owner')$$, '42501', null, 'Mijoz o''zini xodim qila olmaydi');

reset role;

-- ---------------------------------------------------------------- Boshqa mijoz c2
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.reservations), 0, 'Boshqa mijoz begona bronni ko''rmaydi');
select is((select count(*)::int from public.reservation_guests), 0, 'Boshqa mijoz begona mehmon ismi va telefonini ko''rmaydi');
reset role;

-- ---------------------------------------------------------------- B restoran egasi
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

select is((select count(*)::int from public.restaurants), 2, 'B egasi nashr qilingan A va o''zining qoralama B restoranini ko''radi');
select is((select count(*)::int from public.reservations), 0, 'B egasi A restoran bronlarini ko''rmaydi');
select is((select count(*)::int from public.reservation_guests), 0, 'B egasi A mehmonlarining ma''lumotini ko''rmaydi');
select is((select count(*)::int from public.table_allocations), 0, 'B egasi A stol bandligini ko''rmaydi');
select is((select count(*)::int from public.staff_members), 1, 'B egasi faqat o''z jamoasini ko''radi');
select lives_ok($$update public.restaurants set name = '{"uz":"Buzilgan","ru":"Сломано"}' where slug = 'test-a'$$, 'B egasining A ni o''zgartirish urinishi xatosiz o''tadi, lekin...');
select lives_ok($$update public.restaurants set name = '{"uz":"B yangi","ru":"B новый"}' where slug = 'test-b'$$, 'B egasi o''z restoranini tahrirlaydi');
select throws_ok(
  $$insert into public.restaurant_halls (restaurant_id, branch_id, name) values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '{"uz":"x","ru":"x"}')$$,
  '42501', null, 'B egasi A restoranga zal qo''sha olmaydi'
);
select throws_ok(
  $$insert into public.restaurant_halls (restaurant_id, branch_id, name) values ('10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a', '{"uz":"x","ru":"x"}')$$,
  '23503', null, 'Begona filialni o''z restorani nomi bilan ulab bo''lmaydi (composite FK)'
);
select throws_ok($$update public.restaurants set status = 'published' where slug = 'test-b'$$, '42501', null, 'Egasi restoranni o''zi nashr qila olmaydi');

reset role;
select is((select name ->> 'uz' from public.restaurants where slug = 'test-a'), 'A restoran', '...A restoran nomi o''zgarmagan');
select is((select name ->> 'uz' from public.restaurants where slug = 'test-b'), 'B yangi', 'B restoran nomi yangilandi');

-- ---------------------------------------------------------------- A restoran xodimlari
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select is((select count(*)::int from public.reservations), 1, 'Host o''z restorani bronlarini ko''radi');
select is((select count(*)::int from public.reservation_guests), 1, 'Host bron qilgan mehmon ismi va telefonini ko''radi');
select is((select count(*)::int from public.table_allocations), 1, 'Host stol bandligini ko''radi');
select is((select count(*)::int from public.profiles), 1, 'Host mijozlar profilini to''g''ridan-to''g''ri ko''rmaydi');
select throws_ok(
  $$insert into public.restaurant_halls (restaurant_id, branch_id, name) values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '{"uz":"VIP","ru":"VIP"}')$$,
  '42501', null, 'Host zal qo''sha olmaydi'
);
select is((select count(*)::int from public.audit_logs), 0, 'Host audit jurnalini ko''rmaydi');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.restaurant_halls (restaurant_id, branch_id, name, hall_type) values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '{"uz":"VIP zal","ru":"VIP зал"}', 'vip')$$,
  'Manager zal qo''shadi'
);
select lives_ok($$update public.booking_rules set max_party_size = 20 where restaurant_id = '10000000-0000-0000-0000-00000000000a'$$, 'Manager bron qoidalarini o''zgartiradi');
select throws_ok($$update public.booking_rules set restaurant_id = '10000000-0000-0000-0000-00000000000b'$$, '42501', null, 'Bron qoidasini boshqa restoranga ko''chirib bo''lmaydi');
select throws_ok(
  $$insert into public.restaurant_media (restaurant_id, branch_id, kind, storage_path, rights_confirmed, uploaded_by, status)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'photo', 'a/1.webp', true, '00000000-0000-0000-0000-0000000000a2', 'approved')$$,
  '42501', null, 'Manager o''z mediasini o''zi tasdiqlay olmaydi'
);
select lives_ok(
  $$insert into public.restaurant_media (restaurant_id, branch_id, kind, storage_path, rights_confirmed, uploaded_by)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'photo', 'a/1.webp', true, '00000000-0000-0000-0000-0000000000a2')$$,
  'Manager rasm yuklaydi (tekshiruvga tushadi)'
);
reset role;

set local role anon;
select set_config('request.jwt.claims', '', true);
select is((select count(*)::int from public.restaurant_media), 0, 'Tasdiqlanmagan rasm mehmonga ko''rinmaydi');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select ok((select count(*) from public.audit_logs) > 0, 'Egasi o''z restorani audit jurnalini ko''radi');
select is((select count(*)::int from public.audit_logs where restaurant_id <> '10000000-0000-0000-0000-00000000000a'), 0, 'Egasi begona restoran jurnalini ko''rmaydi');
reset role;

-- ---------------------------------------------------------------- Super admin
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
select is((select count(*)::int from public.restaurants), 2, 'Super admin qoralama restoranlarni ham ko''radi');
select is((select count(*)::int from public.reservations), 1, 'Super admin bronlarni ko''radi');
select throws_ok($$update public.restaurants set status = 'published'$$, '42501', null, 'Super admin ham holatni to''g''ridan-to''g''ri o''zgartirmaydi (faqat funksiya orqali)');
reset role;

select * from finish();
rollback;
