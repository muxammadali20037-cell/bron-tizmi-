-- Bron himoyasi: ikki marta bron yo'q, holat o'tishlari, tarix, stolni bo'shatish.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
\ir _fixtures.psql

-- Fixtures: A restoranda 1-stol 2030-01-10 19:00–21:00 (Toshkent) band, bron tasdiqlangan.

select throws_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1',
            'block', tstzrange('2030-01-10 20:00+05', '2030-01-10 22:00+05'))$$,
  '23P01', null, 'Kesishgan vaqtga o''sha stolni ikkinchi marta band qilib bo''lmaydi'
);

select throws_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1',
            'block', tstzrange('2030-01-10 19:30+05', '2030-01-10 20:00+05'))$$,
  '23P01', null, 'Ichida joylashgan qisqa oraliq ham rad etiladi'
);

select lives_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1',
            'block', tstzrange('2030-01-10 21:00+05', '2030-01-10 23:00+05'))$$,
  'Tugashi bilan boshlanadigan keyingi oraliq ruxsat etiladi (21:00 dan)'
);

select lives_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a2',
            'block', tstzrange('2030-01-10 19:00+05', '2030-01-10 21:00+05'))$$,
  'Xuddi shu vaqtda boshqa stolni band qilish mumkin'
);

select throws_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000b', '40000000-0000-0000-0000-0000000000b1',
            'block', tstzrange('2030-01-10 19:00+05', '2030-01-10 21:00+05'))$$,
  '23503', null, 'Boshqa restoranning stolini o''z nomidan band qilib bo''lmaydi'
);

-- Ikkinchi bron: o'sha stol, o'sha vaqt — bron yozuvi yaratiladi, lekin stolni band qilish rad etiladi
insert into public.reservations (id, restaurant_id, branch_id, customer_id, party_size, starts_at, ends_at, status, source)
values ('50000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
        '00000000-0000-0000-0000-0000000000c2', 2, '2030-01-10 19:00+05', '2030-01-10 21:00+05', 'pending', 'sofriva');

select throws_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, reservation_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1',
            '50000000-0000-0000-0000-0000000000a2', 'reservation', tstzrange('2030-01-10 19:00+05', '2030-01-10 21:00+05'))$$,
  '23P01', null, 'Ikkinchi mijoz band stolni ololmaydi'
);

-- Birinchi bron bekor qilinadi -> stol bo'shaydi
update public.reservations set status = 'cancelled', status_reason = 'Mijoz bekor qildi'
where id = '50000000-0000-0000-0000-0000000000a1';

select is(
  (select bool_or(active) from public.table_allocations where reservation_id = '50000000-0000-0000-0000-0000000000a1'),
  false,
  'Bekor qilingan bronning stol bandligi avtomatik o''chdi'
);

select lives_ok(
  $$insert into public.table_allocations (restaurant_id, branch_id, table_id, reservation_id, kind, period)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1',
            '50000000-0000-0000-0000-0000000000a2', 'reservation', tstzrange('2030-01-10 19:00+05', '2030-01-10 21:00+05'))$$,
  'Bo''shagan stolni endi ikkinchi mijoz oladi'
);

select throws_ok(
  $$update public.table_allocations set active = true where reservation_id = '50000000-0000-0000-0000-0000000000a1'$$,
  'P0001', null, 'Yakunlangan bron uchun stolni qayta band qilib bo''lmaydi'
);

-- Holat o'tishlari
select throws_ok(
  $$update public.reservations set status = 'confirmed' where id = '50000000-0000-0000-0000-0000000000a1'$$,
  'P0001', null, 'Bekor qilingan bronni qayta tasdiqlab bo''lmaydi'
);
select throws_ok(
  $$update public.reservations set status = 'completed' where id = '50000000-0000-0000-0000-0000000000a2'$$,
  'P0001', null, 'Kutilayotgan bronni to''g''ridan-to''g''ri yakunlab bo''lmaydi'
);
select lives_ok($$update public.reservations set status = 'confirmed' where id = '50000000-0000-0000-0000-0000000000a2'$$, 'pending → confirmed');
select isnt((select confirmed_at from public.reservations where id = '50000000-0000-0000-0000-0000000000a2'), null, 'Tasdiq vaqti yozildi');
select lives_ok($$update public.reservations set status = 'checked_in' where id = '50000000-0000-0000-0000-0000000000a2'$$, 'confirmed → checked_in');
select lives_ok($$update public.reservations set status = 'completed' where id = '50000000-0000-0000-0000-0000000000a2'$$, 'checked_in → completed');
select throws_ok(
  $$update public.reservations set status = 'no_show' where id = '50000000-0000-0000-0000-0000000000a2'$$,
  'P0001', null, 'Yakunlangan bron holatini o''zgartirib bo''lmaydi'
);

select is(
  (select array_agg(to_status::text order by id) from public.reservation_status_history
   where reservation_id = '50000000-0000-0000-0000-0000000000a2'),
  array['pending', 'confirmed', 'checked_in', 'completed'],
  'Holat tarixi to''liq yozildi'
);

select throws_ok(
  $$insert into public.reservations (restaurant_id, branch_id, party_size, starts_at, ends_at, status, source)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 2, '2030-01-11 19:00+05', '2030-01-11 21:00+05', 'cancelled', 'phone')$$,
  'P0001', null, 'Bron yakuniy holatda yaratilmaydi'
);
select throws_ok(
  $$insert into public.reservations (restaurant_id, branch_id, party_size, starts_at, ends_at, source)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 2, '2030-01-11 21:00+05', '2030-01-11 19:00+05', 'phone')$$,
  '23514', null, 'Tugash vaqti boshlanishdan oldin bo''lishi mumkin emas'
);
select throws_ok(
  $$insert into public.reservations (restaurant_id, branch_id, party_size, starts_at, ends_at, source)
    values ('10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a', 2, '2030-01-11 19:00+05', '2030-01-11 21:00+05', 'phone')$$,
  '23503', null, 'Bron filiali boshqa restoranniki bo''lishi mumkin emas'
);

select matches(
  (select code from public.reservations where id = '50000000-0000-0000-0000-0000000000a2'),
  '^[2-9A-HJ-NP-Z]{8}$',
  'Bron kodi 8 belgili, adashtiradigan belgilarsiz'
);

select * from finish();
rollback;
