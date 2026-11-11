-- notifications — faqat server (service role) ishlatadigan navbat.
-- RLS yoqilgan, grant yo'q. Niyatni aniq yozib qo'yish uchun mijoz rollari
-- uchun "hech narsa ruxsat etilmaydi" siyosati qo'shiladi (advisor 0008).
-- service_role RLS'ni chetlab o'tadi, shuning uchun server ishiga ta'sir qilmaydi.

create policy notifications_no_client_access on public.notifications
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on policy notifications_no_client_access on public.notifications is
  'Mijoz ilovasi bu jadvalni o''qiy olmaydi va yoza olmaydi. Faqat server.';
