-- SOFRIVA: asosiy PostgreSQL kengaytmalari.
-- Supabase tavsiyasiga ko'ra kengaytmalar `extensions` sxemasiga o'rnatiladi.
-- (PostGIS olib tashlandi: MVP'da koordinatalar oddiy raqam; xarita qidiruvi V1'da.)

-- Bir stolga ustma-ust bronni taqiqlovchi exclusion constraint uchun (uuid = va tstzrange && bitta indeksda)
create extension if not exists btree_gist with schema extensions;

-- Restoran nomi bo'yicha xatolarga chidamli qidiruv (trigram), Sprint 10
create extension if not exists pg_trgm with schema extensions;

-- Qidiruvda diakritik belgilarni olib tashlash (o' / o‘ / o), Sprint 10
create extension if not exists unaccent with schema extensions;
