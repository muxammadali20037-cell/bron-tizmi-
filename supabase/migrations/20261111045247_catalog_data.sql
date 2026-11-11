-- SOFRIVA: katalog ma'lumotnomalari (haqiqiy ma'lumot, soxta yozuv emas).
-- Toshkent 2020-yildan beri 12 tumanga bo'lingan (Yangihayot tumani 2020-yilda tashkil etilgan).

insert into public.districts (code, city, name, sort_order) values
  ('bektemir', 'tashkent', '{"uz": "Bektemir", "ru": "Бектемирский", "en": "Bektemir"}', 1),
  ('chilonzor', 'tashkent', '{"uz": "Chilonzor", "ru": "Чиланзарский", "en": "Chilanzar"}', 2),
  ('mirobod', 'tashkent', '{"uz": "Mirobod", "ru": "Мирабадский", "en": "Mirabad"}', 3),
  ('mirzo_ulugbek', 'tashkent', '{"uz": "Mirzo Ulug‘bek", "ru": "Мирзо-Улугбекский", "en": "Mirzo Ulugbek"}', 4),
  ('olmazor', 'tashkent', '{"uz": "Olmazor", "ru": "Алмазарский", "en": "Almazar"}', 5),
  ('sergeli', 'tashkent', '{"uz": "Sergeli", "ru": "Сергелийский", "en": "Sergeli"}', 6),
  ('shayxontohur', 'tashkent', '{"uz": "Shayxontohur", "ru": "Шайхантахурский", "en": "Shaykhantakhur"}', 7),
  ('uchtepa', 'tashkent', '{"uz": "Uchtepa", "ru": "Учтепинский", "en": "Uchtepa"}', 8),
  ('yakkasaroy', 'tashkent', '{"uz": "Yakkasaroy", "ru": "Яккасарайский", "en": "Yakkasaray"}', 9),
  ('yangihayot', 'tashkent', '{"uz": "Yangihayot", "ru": "Янгихаётский", "en": "Yangihayot"}', 10),
  ('yashnobod', 'tashkent', '{"uz": "Yashnobod", "ru": "Яшнабадский", "en": "Yashnobod"}', 11),
  ('yunusobod', 'tashkent', '{"uz": "Yunusobod", "ru": "Юнусабадский", "en": "Yunusabad"}', 12)
on conflict (code) do nothing;

insert into public.cuisines (code, name, sort_order) values
  ('uzbek', '{"uz": "O‘zbek", "ru": "Узбекская", "en": "Uzbek"}', 1),
  ('european', '{"uz": "Yevropa", "ru": "Европейская", "en": "European"}', 2),
  ('italian', '{"uz": "Italyan", "ru": "Итальянская", "en": "Italian"}', 3),
  ('japanese', '{"uz": "Yapon", "ru": "Японская", "en": "Japanese"}', 4),
  ('pan_asian', '{"uz": "Panaziya", "ru": "Паназиатская", "en": "Pan-Asian"}', 5),
  ('chinese', '{"uz": "Xitoy", "ru": "Китайская", "en": "Chinese"}', 6),
  ('korean', '{"uz": "Koreys", "ru": "Корейская", "en": "Korean"}', 7),
  ('turkish', '{"uz": "Turk", "ru": "Турецкая", "en": "Turkish"}', 8),
  ('georgian', '{"uz": "Gruzin", "ru": "Грузинская", "en": "Georgian"}', 9),
  ('russian', '{"uz": "Rus", "ru": "Русская", "en": "Russian"}', 10),
  ('middle_eastern', '{"uz": "Yaqin Sharq", "ru": "Ближневосточная", "en": "Middle Eastern"}', 11),
  ('indian', '{"uz": "Hind", "ru": "Индийская", "en": "Indian"}', 12),
  ('american', '{"uz": "Amerika", "ru": "Американская", "en": "American"}', 13),
  ('seafood', '{"uz": "Dengiz mahsulotlari", "ru": "Морепродукты", "en": "Seafood"}', 14),
  ('steakhouse', '{"uz": "Steykxaus", "ru": "Стейк-хаус", "en": "Steakhouse"}', 15),
  ('vegetarian', '{"uz": "Vegetarian", "ru": "Вегетарианская", "en": "Vegetarian"}', 16)
on conflict (code) do nothing;

insert into public.facility_types (code, name, icon, has_details, sort_order) values
  ('wifi', '{"uz": "Wi-Fi", "ru": "Wi-Fi", "en": "Wi-Fi"}', 'wifi', false, 1),
  ('parking', '{"uz": "Avtoturargoh", "ru": "Парковка", "en": "Parking"}', 'square-parking', true, 2),
  ('kids_playground', '{"uz": "Bolalar o‘yin maydonchasi", "ru": "Детская игровая площадка", "en": "Kids playground"}', 'toy-brick', true, 3),
  ('kids_menu', '{"uz": "Bolalar menyusi", "ru": "Детское меню", "en": "Kids menu"}', 'utensils', false, 4),
  ('high_chairs', '{"uz": "Bolalar stuli", "ru": "Детские стульчики", "en": "High chairs"}', 'baby', false, 5),
  ('live_music', '{"uz": "Jonli musiqa", "ru": "Живая музыка", "en": "Live music"}', 'music', true, 6),
  ('terrace', '{"uz": "Ochiq ayvon", "ru": "Летняя терраса", "en": "Outdoor terrace"}', 'sun', false, 7),
  ('vip_rooms', '{"uz": "VIP xonalar", "ru": "VIP-комнаты", "en": "VIP rooms"}', 'crown', false, 8),
  ('banquet_hall', '{"uz": "Banket zali", "ru": "Банкетный зал", "en": "Banquet hall"}', 'party-popper', true, 9),
  ('wheelchair_access', '{"uz": "Nogironlar aravachasi uchun qulay", "ru": "Доступно для колясок", "en": "Wheelchair accessible"}', 'accessibility', false, 10),
  ('prayer_room', '{"uz": "Namozxona", "ru": "Молельная комната", "en": "Prayer room"}', 'moon-star', false, 11),
  ('smoking_area', '{"uz": "Chekish joyi", "ru": "Зона для курения", "en": "Smoking area"}', 'cigarette', false, 12),
  ('card_payment', '{"uz": "Karta orqali to‘lov", "ru": "Оплата картой", "en": "Card payment"}', 'credit-card', false, 13),
  ('air_conditioning', '{"uz": "Konditsioner", "ru": "Кондиционер", "en": "Air conditioning"}', 'air-vent', false, 14)
on conflict (code) do nothing;
