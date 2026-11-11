-- Triggerlar va tekshiruvlar: profil, bron qoidalari, egasini himoya qilish, ko'p tilli matn, audit.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
\ir _fixtures.psql

insert into auth.users (id, phone) values ('00000000-0000-0000-0000-0000000000d1', '998935550011');
select is((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), '+998935550011', 'Yangi foydalanuvchi uchun profil yaratildi');

insert into auth.users (id, phone) values ('00000000-0000-0000-0000-0000000000d2', 'abc');
select is((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'), null, 'Noto''g''ri telefon ro''yxatdan o''tishni to''xtatmaydi, faqat saqlanmaydi');

update auth.users set phone = '998935550012' where id = '00000000-0000-0000-0000-0000000000d1';
select is((select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), '+998935550012', 'Telefon o''zgarsa profil ham yangilanadi');

select is(
  (select count(*)::int from public.booking_rules where branch_id = '20000000-0000-0000-0000-00000000000a'),
  1,
  'Filial yaratilganda bron qoidalari avtomatik yaratildi'
);
select is(
  (select guest_can_choose_table from public.booking_rules where branch_id = '20000000-0000-0000-0000-00000000000a'),
  true,
  'Standart: mijoz stol tanlay oladi'
);

select throws_ok(
  $$delete from public.staff_members where restaurant_id = '10000000-0000-0000-0000-00000000000a' and user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', null, 'Restoranning yagona egasini o''chirib bo''lmaydi'
);
select throws_ok(
  $$update public.staff_members set role = 'manager' where restaurant_id = '10000000-0000-0000-0000-00000000000a' and user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', null, 'Yagona egasining rolini pasaytirib bo''lmaydi'
);
select lives_ok(
  $$delete from public.restaurants where id = '10000000-0000-0000-0000-00000000000b'$$,
  'Bronsiz restoranni (egasi bilan birga) o''chirish mumkin'
);
select throws_ok(
  $$delete from public.restaurants where id = '10000000-0000-0000-0000-00000000000a'$$,
  '23503', null, 'Bronlari bor restoranni o''chirib bo''lmaydi (tarix saqlanadi)'
);

select throws_ok(
  $$insert into public.restaurants (slug, name) values ('test-c', '{"uz": "Faqat o''zbekcha"}')$$,
  '23514', null, 'Restoran nomi rus tilida ham bo''lishi shart'
);
select throws_ok(
  $$insert into public.restaurants (slug, name) values ('test-d', '{"uz": "D", "ru": "D", "de": "D"}')$$,
  '23514', null, 'Faqat uz/ru/en tillari qabul qilinadi'
);
select throws_ok(
  $$insert into public.restaurants (slug, name) values ('Test D!', '{"uz": "D", "ru": "D"}')$$,
  '23514', null, 'Slug faqat kichik lotin harflari, raqam va chiziqcha'
);
select throws_ok(
  $$insert into public.restaurant_tables (restaurant_id, branch_id, hall_id, label, min_party, max_party)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '9', 6, 2)$$,
  '23514', null, 'Stolning eng kam kishi soni eng ko''pidan oshmaydi'
);

update public.restaurants set description = '{"uz": "Yangi tavsif"}' where id = '10000000-0000-0000-0000-00000000000a';
select ok(
  exists (
    select 1 from public.audit_logs
    where entity = 'restaurants' and action = 'update'
      and restaurant_id = '10000000-0000-0000-0000-00000000000a'
      and after -> 'description' ->> 'uz' = 'Yangi tavsif'
  ),
  'Restoran o''zgarishi audit jurnaliga yozildi'
);

-- Bazadagi holat mashinasi src/lib/booking/statuses.ts bilan aynan bir xil bo'lishi shart.
select set_eq(
  $$select f::text || '>' || t::text
    from unnest(enum_range(null::public.reservation_status)) f,
         unnest(enum_range(null::public.reservation_status)) t
    where private.can_transition(f, t)$$,
  array[
    'pending>awaiting_payment', 'pending>confirmed', 'pending>rejected', 'pending>cancelled', 'pending>expired',
    'awaiting_payment>confirmed', 'awaiting_payment>cancelled', 'awaiting_payment>expired',
    'confirmed>checked_in', 'confirmed>cancelled', 'confirmed>no_show',
    'checked_in>completed'
  ],
  'Holat o''tishlari jadvali ilova kodidagi bilan bir xil'
);

select set_eq(
  $$select s::text from unnest(enum_range(null::public.reservation_status)) s where private.is_blocking_status(s)$$,
  array['pending', 'awaiting_payment', 'confirmed', 'checked_in'],
  'Stolni band qiluvchi holatlar ilova kodidagi bilan bir xil'
);

select * from finish();
rollback;
