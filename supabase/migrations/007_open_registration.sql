-- 007_open_registration.sql — снимаем жёсткое ограничение member_key
-- (раньше был CHECK на 6 захардкоженных ключей семьи). Теперь
-- любой пользователь регистрируется со свободным именем; member_key
-- становится произвольной строкой-идентификатором (slug или tg_<id>).

alter table public.users drop constraint if exists users_member_key_check;
