-- OneTable: asosiy PostgreSQL kengaytmalari.
-- Supabase tavsiyasiga ko'ra kengaytmalar `extensions` sxemasiga o'rnatiladi.

-- Bir stolga ustma-ust bronni taqiqlovchi exclusion constraint uchun (uuid = va tstzrange && bitta indeksda)
create extension if not exists btree_gist with schema extensions;

-- Restoran nomi bo'yicha xatolarga chidamli qidiruv (trigram)
create extension if not exists pg_trgm with schema extensions;

-- Qidiruvda diakritik belgilarni olib tashlash (o' / o‘ / o)
create extension if not exists unaccent with schema extensions;

-- "Yaqin atrofdagi restoranlar" qidiruvi uchun geografik koordinatalar
create extension if not exists postgis with schema extensions;
