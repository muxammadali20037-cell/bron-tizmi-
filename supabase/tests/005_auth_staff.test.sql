-- Sprint 3: SMS limiti, onboarding, kirish huquqlari va xodimlarni boshqarish funksiyalari.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
\ir _fixtures.psql

-- Xato kodini (detail) qaytaradigan yordamchi. Muvaffaqiyat bo'lsa — null.
create function public._test_error_code(p_sql text)
returns text
language plpgsql
as $$
declare
  v_detail text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return coalesce(nullif(v_detail, ''), sqlstate);
end;
$$;
grant execute on function public._test_error_code(text) to anon, authenticated, service_role;

-- ------------------------------------------------------------------ Ruxsatlar
set local role anon;
select set_config('request.jwt.claims', '', true);
select throws_ok('select public.get_my_access()', '42501', null, 'Mehmon kirish huquqlarini so''ray olmaydi');
select throws_ok($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901112233', 'staff')$$, '42501', null, 'Mehmon xodim taklif qila olmaydi');
select throws_ok($$select public.register_sms_attempt('+998901112233')$$, '42501', null, 'Mehmon SMS limitini chaqira olmaydi');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select throws_ok($$select public.register_sms_attempt('+998901112233')$$, '42501', null, 'Foydalanuvchi SMS limitini chaqira olmaydi');
reset role;

-- ------------------------------------------------------------------ SMS limiti (service_role)
set local role service_role;
select is(public.register_sms_attempt('+12025550123') ->> 'reason', 'unsupported_phone', 'Faqat +998 raqamlarga SMS');
select is(public.register_sms_attempt('998901112233') ->> 'reason', 'unsupported_phone', 'Raqam E.164 formatida bo''lishi shart');
select is(public.register_sms_attempt('+998901112233') ->> 'allowed', 'true', '1-urinish ruxsat');
select is(public.register_sms_attempt('+998901112233') ->> 'allowed', 'true', '2-urinish ruxsat');
select is(public.register_sms_attempt('+998901112233') ->> 'allowed', 'true', '3-urinish ruxsat');
select is(public.register_sms_attempt('+998901112233') ->> 'reason', 'too_many_attempts', '10 daqiqada 4-urinish rad etiladi');
select is(public.register_sms_attempt('+998901112244') ->> 'allowed', 'true', 'Boshqa raqamga limit ta''sir qilmaydi');
reset role;
select is(
  (select count(*)::int from private.sms_send_attempts where phone_hash like '+998%'),
  0,
  'Telefon ochiq saqlanmaydi (faqat SHA-256 izi)'
);

-- ------------------------------------------------------------------ Mijoz c1: onboarding
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

select is(
  public.get_my_access(),
  '{"is_super_admin": false, "memberships": [], "pending_invitations": 0}'::jsonb,
  'Oddiy mijozning kirish huquqlari: admin emas, restoran yo''q'
);
select is(public._test_error_code($$select public.complete_onboarding('A', 'uz')$$), 'invalid_name', 'Juda qisqa ism rad etiladi');
select is(public._test_error_code($$select public.complete_onboarding('Aziza', 'de')$$), 'invalid_locale', 'Noma''lum til rad etiladi');
select lives_ok($$select public.complete_onboarding('  Aziza  ', 'ru')$$, 'Onboarding yakunlanadi');
select is((select full_name from public.profiles), 'Aziza', 'Ism bo''sh joylarsiz saqlandi');
select is((select locale from public.profiles), 'ru', 'Til saqlandi');
select isnt((select terms_accepted_at from public.profiles), null, 'Rozilik vaqti server tomonidan yozildi');
select throws_ok($$update public.profiles set terms_accepted_at = '2000-01-01'$$, '42501', null, 'Rozilik vaqtini qo''lda o''zgartirib bo''lmaydi');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901112233', 'staff')$$), 'forbidden', 'Mijoz xodim taklif qila olmaydi');
select is(public._test_error_code($$select * from public.get_restaurant_staff('10000000-0000-0000-0000-00000000000a')$$), 'forbidden', 'Mijoz restoran xodimlarini ko''ra olmaydi');
select is(public._test_error_code('select public.admin_overview()'), 'forbidden', 'Mijoz admin raqamlarini ko''ra olmaydi');
reset role;

-- ------------------------------------------------------------------ Owner a1
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(
  (select jsonb_path_query_array(public.get_my_access(), '$.memberships[*].role')),
  '["owner"]'::jsonb,
  'Owner o''z restoranidagi rolini ko''radi'
);
select is((select count(*)::int from public.get_restaurant_staff('10000000-0000-0000-0000-00000000000a')), 4, 'Owner jamoani (ism va telefon bilan) ko''radi');
select is(
  (select phone from public.get_restaurant_staff('10000000-0000-0000-0000-00000000000a') where role = 'host'),
  '+998901110003',
  'Jamoa ro''yxatida telefon E.164 ko''rinishida'
);
select lives_ok($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110006', 'manager')$$, 'Owner mijozni manager sifatida taklif qiladi');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110006', 'host')$$), 'already_invited', 'Bir raqamga ikkinchi faol taklif yo''q');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+99890', 'staff')$$), 'invalid_phone', 'Noto''g''ri raqam rad etiladi');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901119999', 'owner')$$), 'forbidden', 'Owner rolini taklif bilan berib bo''lmaydi');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110003', 'staff')$$), 'already_member', 'Jamoadagi odamni qayta taklif qilib bo''lmaydi');
select is(public._test_error_code($$select public.set_staff_member_role('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'manager')$$), 'cannot_change_self', 'Owner o''z rolini o''zgartira olmaydi');
reset role;

-- ------------------------------------------------------------------ Manager a2
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110007', 'manager')$$), 'forbidden', 'Manager manager taklif qila olmaydi');
select lives_ok($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110007', 'host')$$, 'Manager host taklif qiladi');
select is(
  public._test_error_code(format('select public.revoke_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110006'))),
  'forbidden',
  'Manager owner yuborgan manager taklifini bekor qila olmaydi'
);
select is(public._test_error_code($$select public.set_staff_member_role('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3', 'staff')$$), 'forbidden', 'Rolni faqat owner o''zgartiradi');
select lives_ok($$select public.set_staff_member_active('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', false)$$, 'Manager staff xodimni o''chiradi');
select is(public._test_error_code($$select public.set_staff_member_active('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', false)$$), 'forbidden', 'Manager owner''ni o''chira olmaydi');
select is(public._test_error_code($$select public.set_staff_member_active('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2', false)$$), 'cannot_change_self', 'Manager o''zini o''chira olmaydi');
reset role;

-- ------------------------------------------------------------------ Boshqa restoran egasi b1
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

select is(public._test_error_code($$select * from public.get_restaurant_staff('10000000-0000-0000-0000-00000000000a')$$), 'forbidden', 'Begona restoran egasi A jamoasini ko''rmaydi');
select is(public._test_error_code($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901119999', 'staff')$$), 'forbidden', 'Begona restoran egasi A ga taklif yubora olmaydi');
select is(
  public._test_error_code(format('select public.revoke_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110007' and restaurant_id = '10000000-0000-0000-0000-00000000000a'))),
  'forbidden',
  'Begona restoran egasi A taklifini bekor qila olmaydi'
);
select is(public._test_error_code($$select public.set_staff_member_active('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3', false)$$), 'forbidden', 'Begona restoran egasi A xodimini o''chira olmaydi');
reset role;

-- ------------------------------------------------------------------ Taklif qilingan c1 va c2
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is(
  public._test_error_code('select public.accept_staff_invitation(gen_random_uuid())'),
  'invitation_not_found',
  'Mavjud bo''lmagan taklifni qabul qilib bo''lmaydi'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((select count(*)::int from public.my_staff_invitations()), 1, 'Mijoz o''z raqamiga kelgan taklifni ko''radi');
select is((select restaurant_name ->> 'uz' from public.my_staff_invitations()), 'A restoran', 'Taklifda restoran nomi bor (qoralama bo''lsa ham)');
select is((public.get_my_access() ->> 'pending_invitations')::int, 1, 'Kutilayotgan takliflar soni');
reset role;

-- c2 boshqa odamning taklifini qabul qila olmaydi
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is(
  public._test_error_code(format('select public.accept_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110006'))),
  'invitation_not_found',
  'Boshqa raqamga kelgan taklifni qabul qilib bo''lmaydi'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is(
  public.accept_staff_invitation((select id from public.my_staff_invitations())),
  '10000000-0000-0000-0000-00000000000a'::uuid,
  'Mijoz taklifni qabul qiladi'
);
select is(
  (select jsonb_path_query_array(public.get_my_access(), '$.memberships[*].role')),
  '["manager"]'::jsonb,
  'Endi u A restoranda manager'
);
select is(
  public._test_error_code(format('select public.accept_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110006'))),
  'invitation_not_pending',
  'Qabul qilingan taklifni qayta ishlatib bo''lmaydi'
);
reset role;

select is(
  (select status::text from public.staff_invitations where phone = '+998901110006'),
  'accepted',
  'Taklif holati: qabul qilindi'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select lives_ok(
  format('select public.decline_staff_invitation(%L)', (select id from public.my_staff_invitations())),
  'c2 taklifni rad etadi'
);
select is((select count(*)::int from public.my_staff_invitations()), 0, 'Rad etilgan taklif ro''yxatdan chiqdi');
reset role;
select is(
  (select status::text from public.staff_invitations where phone = '+998901110007'),
  'declined',
  'Taklif holati: rad etildi'
);

-- Muddati o'tgan taklif
insert into public.staff_invitations (restaurant_id, phone, role, invited_by, expires_at, created_at)
values ('10000000-0000-0000-0000-00000000000a', '+998901110007', 'staff', '00000000-0000-0000-0000-0000000000a1', now() - interval '1 minute', now() - interval '8 days');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.my_staff_invitations()), 0, 'Muddati o''tgan taklif ko''rinmaydi');
select is(
  public._test_error_code(format('select public.accept_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110007' and status = 'pending'))),
  'invitation_expired',
  'Muddati o''tgan taklifni qabul qilib bo''lmaydi'
);
reset role;

-- Owner muddati o'tgan taklif o'rniga yangisini yubora oladi
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$select public.invite_staff('10000000-0000-0000-0000-00000000000a', '+998901110007', 'staff')$$, 'Muddati o''tgan taklif o''rniga yangisi yuboriladi');
select lives_ok($$select public.set_staff_member_role('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000c1', 'host')$$, 'Owner xodim rolini o''zgartiradi');
select lives_ok($$select public.set_staff_member_active('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', true)$$, 'Owner o''chirilgan xodimni qayta yoqadi');
select lives_ok(
  format('select public.revoke_staff_invitation(%L)',
    (select id from public.staff_invitations where phone = '+998901110007' and status = 'pending')),
  'Owner taklifni bekor qiladi'
);
reset role;

select is(
  (select array_agg(status::text order by status::text) from public.staff_invitations where phone = '+998901110007'),
  array['declined', 'expired', 'revoked'],
  'Taklif tarixi: muddati o''tgan, rad etilgan, bekor qilingan'
);
select is((select role::text from public.staff_members where user_id = '00000000-0000-0000-0000-0000000000c1'), 'host', 'Yangi rol saqlandi');
select ok(
  (select count(*) >= 3 from public.audit_logs where entity = 'staff_invitations'),
  'Taklif o''zgarishlari audit jurnaliga yozildi'
);

-- ------------------------------------------------------------------ Super admin
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
select is((public.get_my_access() ->> 'is_super_admin')::boolean, true, 'Admin o''zini admin deb ko''radi');
select is((public.admin_overview() -> 'restaurants' ->> 'published')::int, 1, 'Admin raqamlari: 1 ta nashr qilingan restoran');
select is((public.admin_overview() ->> 'users')::int, 8, 'Admin raqamlari: foydalanuvchilar soni');
select is((public.admin_overview() ->> 'reservations_upcoming')::int, 1, 'Admin raqamlari: kelgusi bronlar');
select is((select count(*)::int from public.get_restaurant_staff('10000000-0000-0000-0000-00000000000a')), 5, 'Admin istalgan restoran jamoasini ko''radi');
reset role;

select * from finish();
rollback;
