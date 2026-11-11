-- SOFRIVA: ruxsatlar (GRANT) va RLS siyosatlari.
--
-- Tamoyillar:
--  1. Hamma narsa avval yopiq: anon/authenticated'dan barcha jadval huquqlari olinadi,
--     keyin har jadval uchun faqat kerakli amallar (va kerak bo'lsa faqat ayrim ustunlar) beriladi.
--  2. Mehmon (anon) faqat nashr qilingan restoranlarning ommaviy ma'lumotini o'qiydi.
--  3. Restoran xodimi faqat o'z restoranini ko'radi; tahrirlash — owner va manager.
--  4. Bron, stol bandligi, xodim qo'shish, restoran holatini o'zgartirish — to'g'ridan-to'g'ri
--     yozish yo'q; bular keyingi sprintlarda baza funksiyalari orqali qilinadi.
--  5. auth.uid() va yordamchi funksiyalar `(select ...)` ichida — har qator uchun qayta hisoblanmaydi.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Kataloglar: hamma o'qiydi
-- ---------------------------------------------------------------------------

grant select on public.districts, public.cuisines, public.facility_types to anon, authenticated;

create policy "Katalog hammaga ochiq" on public.districts for select to anon, authenticated using (true);
create policy "Katalog hammaga ochiq" on public.cuisines for select to anon, authenticated using (true);
create policy "Katalog hammaga ochiq" on public.facility_types for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Profil va adminlar
-- ---------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant update (full_name, locale, terms_accepted_at) on public.profiles to authenticated;

create policy "O'z profilini ko'radi" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_super_admin()));
create policy "O'z profilini tahrirlaydi" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select on public.platform_admins to authenticated;
create policy "Admin o'zini va admin hammani ko'radi" on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_super_admin()));

-- ---------------------------------------------------------------------------
-- Restoran va filial
-- ---------------------------------------------------------------------------

grant select on public.restaurants to anon, authenticated;
grant update (name, description) on public.restaurants to authenticated;

create policy "Nashr qilingan restoranni hamma ko'radi" on public.restaurants for select to anon, authenticated
  using (
    status = 'published'
    or (select private.is_restaurant_member(id))
    or (select private.is_super_admin())
  );
create policy "Owner va manager tahrirlaydi" on public.restaurants for update to authenticated
  using (
    status <> 'suspended'
    and (select private.has_restaurant_role(id, array['owner', 'manager']::public.staff_role[]))
  )
  with check (
    status <> 'suspended'
    and (select private.has_restaurant_role(id, array['owner', 'manager']::public.staff_role[]))
  );

grant select on public.restaurant_branches to anon, authenticated;
grant update (name, address, district_code, latitude, longitude, phone, price_level)
  on public.restaurant_branches to authenticated;

create policy "Ommaviy filialni hamma ko'radi" on public.restaurant_branches for select to anon, authenticated
  using (
    (is_active and (select private.is_restaurant_public(restaurant_id)))
    or (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
  );
create policy "Owner va manager tahrirlaydi" on public.restaurant_branches for update to authenticated
  using ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
  with check ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])));

-- ---------------------------------------------------------------------------
-- Xodimlar va takliflar (yozish — Sprint 3 funksiyalari orqali)
-- ---------------------------------------------------------------------------

grant select on public.staff_members to authenticated;
create policy "Xodim o'z restorani jamoasini ko'radi" on public.staff_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
  );

grant select on public.staff_invitations to authenticated;
create policy "Owner va manager takliflarni ko'radi" on public.staff_invitations for select to authenticated
  using (
    (select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[]))
    or (select private.is_super_admin())
    or (
      status = 'pending'
      and phone = (select p.phone from public.profiles as p where p.id = (select auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- Filial sozlamalari, zallar, stollar: ommaviy o'qish + owner/manager tahrirlaydi
-- ---------------------------------------------------------------------------

grant select on
  public.restaurant_cuisines,
  public.restaurant_facilities,
  public.opening_hours,
  public.opening_hour_exceptions,
  public.booking_rules,
  public.restaurant_halls,
  public.restaurant_tables,
  public.table_features
to anon, authenticated;

grant insert, update, delete on
  public.restaurant_cuisines,
  public.restaurant_facilities,
  public.opening_hours,
  public.opening_hour_exceptions,
  public.restaurant_halls,
  public.restaurant_tables,
  public.table_features
to authenticated;

grant update (
  slot_interval_minutes,
  default_duration_minutes,
  min_lead_minutes,
  max_advance_days,
  min_party_size,
  max_party_size,
  confirmation_mode,
  pending_hold_minutes,
  guest_can_choose_table,
  cancellation_cutoff_minutes,
  last_seating_before_close_minutes,
  max_active_reservations_per_guest
) on public.booking_rules to authenticated;

-- Bir xil qoidani 8 jadvalga qo'yish
do $$
declare
  t text;
begin
  foreach t in array array[
    'restaurant_cuisines',
    'restaurant_facilities',
    'opening_hours',
    'opening_hour_exceptions',
    'booking_rules',
    'restaurant_halls',
    'restaurant_tables',
    'table_features'
  ] loop
    execute format($f$
      create policy "Ommaviy restoran ma'lumotini hamma ko'radi" on public.%1$I for select to anon, authenticated
        using (
          (select private.is_restaurant_public(restaurant_id))
          or (select private.is_restaurant_member(restaurant_id))
          or (select private.is_super_admin())
        )
    $f$, t);

    execute format($f$
      create policy "Owner va manager tahrirlaydi" on public.%1$I for update to authenticated
        using ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
        with check ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
    $f$, t);

    if t <> 'booking_rules' then
      execute format($f$
        create policy "Owner va manager qo'shadi" on public.%1$I for insert to authenticated
          with check ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
      $f$, t);

      execute format($f$
        create policy "Owner va manager o'chiradi" on public.%1$I for delete to authenticated
          using ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
      $f$, t);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Media: ommaga faqat tasdiqlangani; xodim o'z restoranidagi hammasini ko'radi
-- ---------------------------------------------------------------------------

grant select on public.restaurant_media to anon, authenticated;
grant insert (
  restaurant_id, branch_id, hall_id, facility_code, kind, storage_path, stream_uid, poster_path,
  width, height, duration_seconds, alt, sort_order, rights_confirmed, uploaded_by
) on public.restaurant_media to authenticated;
grant update (hall_id, facility_code, alt, sort_order) on public.restaurant_media to authenticated;
grant delete on public.restaurant_media to authenticated;

create policy "Tasdiqlangan media hammaga ko'rinadi" on public.restaurant_media for select to anon, authenticated
  using (
    (status = 'approved' and (select private.is_restaurant_public(restaurant_id)))
    or (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
  );
create policy "Owner va manager yuklaydi" on public.restaurant_media for insert to authenticated
  with check (
    (select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[]))
    and uploaded_by = (select auth.uid())
  );
create policy "Owner va manager tahrirlaydi" on public.restaurant_media for update to authenticated
  using ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])))
  with check ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])));
create policy "Owner va manager o'chiradi" on public.restaurant_media for delete to authenticated
  using ((select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[])));

-- ---------------------------------------------------------------------------
-- Bronlar: faqat o'qish (yaratish va o'zgartirish — Sprint 7 funksiyalari)
-- ---------------------------------------------------------------------------

create or replace function private.is_reservation_customer(p_reservation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.reservations
    where id = p_reservation_id and customer_id = (select auth.uid())
  );
$$;

grant select on
  public.reservations,
  public.reservation_guests,
  public.reservation_status_history,
  public.table_allocations
to authenticated;

create policy "Mijoz o'z bronini, xodim o'z restoraninikini ko'radi" on public.reservations for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
  );

create policy "Mijoz o'z bronini, xodim o'z restoraninikini ko'radi" on public.reservation_guests for select to authenticated
  using (
    (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
    or private.is_reservation_customer(reservation_id)
  );

create policy "Mijoz o'z bronini, xodim o'z restoraninikini ko'radi" on public.reservation_status_history for select to authenticated
  using (
    (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
    or private.is_reservation_customer(reservation_id)
  );

create policy "Stol bandligini faqat xodim ko'radi" on public.table_allocations for select to authenticated
  using (
    (select private.is_restaurant_member(restaurant_id))
    or (select private.is_super_admin())
  );

-- ---------------------------------------------------------------------------
-- Telegram, audit. Bildirishnomalar navbati — faqat service role (siyosat yo'q = hamma uchun yopiq).
-- ---------------------------------------------------------------------------

grant select on public.telegram_links to authenticated;
create policy "O'z Telegram bog'lanishini ko'radi" on public.telegram_links for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      restaurant_id is not null
      and (select private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.staff_role[]))
    )
  );

grant select on public.audit_logs to authenticated;
create policy "Owner o'z restorani jurnalini, admin hammasini ko'radi" on public.audit_logs for select to authenticated
  using (
    (select private.is_super_admin())
    or (
      restaurant_id is not null
      and (select private.has_restaurant_role(restaurant_id, array['owner']::public.staff_role[]))
    )
  );
