-- 004_tg_login.sql — короткоживущие токены для логина через t.me/<bot>?start=<token>
create table if not exists public.tg_login_tokens (
  token text primary key,
  tg_user_id text,
  tg_first_name text,
  tg_last_name text,
  tg_username text,
  tg_photo_url text,
  member_key text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  consumed_at timestamptz
);
create index if not exists idx_tg_login_tokens_expires on public.tg_login_tokens(expires_at);
alter table public.tg_login_tokens enable row level security;

-- Никаких client policies: к таблице обращается только service_role.
-- (Service role bypassит RLS, поэтому пустых policies достаточно).
