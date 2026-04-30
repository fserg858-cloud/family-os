-- 005_family_calendar.sql — общесемейный календарь событий
create table if not exists public.family_calendar (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete set null,
  title text not null,
  notes text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  for_members uuid[] default '{}',
  reminder_24h_sent boolean default false,
  reminder_1h_sent boolean default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_family_calendar_starts on public.family_calendar(starts_at);
alter table public.family_calendar enable row level security;
drop policy if exists "calendar read all" on public.family_calendar;
create policy "calendar read all" on public.family_calendar for select using (auth.role() = 'authenticated');
drop policy if exists "calendar write all" on public.family_calendar;
create policy "calendar write all" on public.family_calendar for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
