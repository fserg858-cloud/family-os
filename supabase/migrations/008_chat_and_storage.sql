-- 008_chat_and_storage.sql — общий семейный чат с фото-вложениями.

-- ----------------------------------------------------------------
-- Таблица сообщений
-- ----------------------------------------------------------------
create table if not exists public.family_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  attachment_url text,
  attachment_type text,                       -- "image" | null
  created_at timestamptz not null default now()
);

create index if not exists family_messages_created_at_idx
  on public.family_messages (created_at desc);

alter table public.family_messages enable row level security;

drop policy if exists "family_messages_select_authed" on public.family_messages;
create policy "family_messages_select_authed" on public.family_messages
  for select to authenticated using (true);

drop policy if exists "family_messages_insert_self" on public.family_messages;
create policy "family_messages_insert_self" on public.family_messages
  for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "family_messages_delete_self" on public.family_messages;
create policy "family_messages_delete_self" on public.family_messages
  for delete to authenticated using (auth.uid() = sender_id);

-- ----------------------------------------------------------------
-- Storage bucket для фото-вложений (публичный read, авторизованный upload)
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('family-uploads', 'family-uploads', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "family_uploads_read" on storage.objects;
create policy "family_uploads_read" on storage.objects
  for select to public
  using (bucket_id = 'family-uploads');

drop policy if exists "family_uploads_insert_authed" on storage.objects;
create policy "family_uploads_insert_authed" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'family-uploads');

drop policy if exists "family_uploads_delete_self" on storage.objects;
create policy "family_uploads_delete_self" on storage.objects
  for delete to authenticated
  using (bucket_id = 'family-uploads' and owner = auth.uid());
