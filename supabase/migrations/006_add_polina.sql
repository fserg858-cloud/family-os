-- 006_add_polina.sql — добавляем Полину (девушку Фёдора) в список member_key
-- Расширяем CHECK constraint таблицы public.users
alter table public.users drop constraint if exists users_member_key_check;
alter table public.users add constraint users_member_key_check
  check (member_key in ('fedor','ignat','nikolay','elena','tatyana','polina'));
