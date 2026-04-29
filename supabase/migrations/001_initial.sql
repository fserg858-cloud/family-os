-- Family OS — initial schema
-- Run in Supabase SQL Editor (or via supabase db push)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  member_key text not null check (member_key in ('fedor','ignat','nikolay','elena','tatyana')),
  display_name text not null,
  age int,
  ui_profile text not null default 'default' check (ui_profile in ('default','teen','elder')),
  level int not null default 1,
  xp int not null default 0,
  streak_days int not null default 0,
  avatar text,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

drop policy if exists "users self select" on public.users;
create policy "users self select" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users family read" on public.users;
create policy "users family read" on public.users
  for select using (auth.role() = 'authenticated');

drop policy if exists "users self update" on public.users;
create policy "users self update" on public.users
  for update using (auth.uid() = id);

drop policy if exists "users self insert" on public.users;
create policy "users self insert" on public.users
  for insert with check (auth.uid() = id);

-- ============================================================
-- GOALS (private)
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  horizon text not null check (horizon in ('daily','weekly','monthly','yearly')),
  target numeric default 100,
  progress numeric not null default 0,
  status text not null default 'active' check (status in ('active','done','paused')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.goals enable row level security;
drop policy if exists "goals owner all" on public.goals;
create policy "goals owner all" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- HABITS (private)
-- ============================================================
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  why text,
  cadence text not null default 'daily' check (cadence in ('daily','weekly')),
  streak int not null default 0,
  best_streak int not null default 0,
  xp_per_log int not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.habits enable row level security;
drop policy if exists "habits owner all" on public.habits;
create policy "habits owner all" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  done_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  unique (habit_id, done_on)
);
alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs owner all" on public.habit_logs;
create policy "habit_logs owner all" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- HEALTH (private)
-- ============================================================
create table if not exists public.health_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('nutrition','sleep','workout','metric','water')),
  occurred_on date not null default current_date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.health_logs enable row level security;
drop policy if exists "health owner all" on public.health_logs;
create policy "health owner all" on public.health_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- AI MEMORY + CONVERSATIONS (private)
-- ============================================================
create table if not exists public.ai_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null,
  value text not null,
  importance int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);
alter table public.ai_memory enable row level security;
drop policy if exists "ai_memory owner all" on public.ai_memory;
create policy "ai_memory owner all" on public.ai_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_conversations enable row level security;
drop policy if exists "ai_conversations owner all" on public.ai_conversations;
create policy "ai_conversations owner all" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- REFLECTIONS (private)
-- ============================================================
create table if not exists public.reflections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  occurred_on date not null default current_date,
  win text,
  lesson text,
  next_step text,
  ai_insight text,
  mood int,
  created_at timestamptz not null default now(),
  unique (user_id, occurred_on)
);
alter table public.reflections enable row level security;
drop policy if exists "reflections owner all" on public.reflections;
create policy "reflections owner all" on public.reflections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- COMPETENCIES + LEARNING + ACHIEVEMENTS (private)
-- ============================================================
create table if not exists public.competencies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  level int not null default 1,
  progress numeric not null default 0,
  category text,
  created_at timestamptz not null default now()
);
alter table public.competencies enable row level security;
drop policy if exists "competencies owner all" on public.competencies;
create policy "competencies owner all" on public.competencies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.learning_content (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  source text,
  url text,
  status text not null default 'queued' check (status in ('queued','active','done')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.learning_content enable row level security;
drop policy if exists "learning_content owner all" on public.learning_content;
create policy "learning_content owner all" on public.learning_content
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);
alter table public.achievements enable row level security;
drop policy if exists "achievements owner all" on public.achievements;
create policy "achievements owner all" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- FAMILY-WIDE TABLES (visible to all authenticated)
-- ============================================================
create table if not exists public.family_tasks (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  due_at timestamptz,
  reward_xp int not null default 15,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.family_tasks enable row level security;
drop policy if exists "family_tasks read all" on public.family_tasks;
create policy "family_tasks read all" on public.family_tasks
  for select using (auth.role() = 'authenticated');
drop policy if exists "family_tasks write all" on public.family_tasks;
create policy "family_tasks write all" on public.family_tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists public.family_events (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.users(id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.family_events enable row level security;
drop policy if exists "family_events read all" on public.family_events;
create policy "family_events read all" on public.family_events
  for select using (auth.role() = 'authenticated');
drop policy if exists "family_events insert all" on public.family_events;
create policy "family_events insert all" on public.family_events
  for insert with check (auth.role() = 'authenticated');

create table if not exists public.family_challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  starts_on date not null default current_date,
  ends_on date,
  reward_xp int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.family_challenges enable row level security;
drop policy if exists "family_challenges read all" on public.family_challenges;
create policy "family_challenges read all" on public.family_challenges
  for select using (auth.role() = 'authenticated');
drop policy if exists "family_challenges write all" on public.family_challenges;
create policy "family_challenges write all" on public.family_challenges
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists public.challenge_progress (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.family_challenges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  progress numeric not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);
alter table public.challenge_progress enable row level security;
drop policy if exists "challenge_progress read all" on public.challenge_progress;
create policy "challenge_progress read all" on public.challenge_progress
  for select using (auth.role() = 'authenticated');
drop policy if exists "challenge_progress write all" on public.challenge_progress;
create policy "challenge_progress write all" on public.challenge_progress
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists public.shopping_list (
  id uuid primary key default uuid_generate_v4(),
  added_by uuid references public.users(id) on delete set null,
  item text not null,
  qty text,
  bought boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.shopping_list enable row level security;
drop policy if exists "shopping read all" on public.shopping_list;
create policy "shopping read all" on public.shopping_list
  for select using (auth.role() = 'authenticated');
drop policy if exists "shopping write all" on public.shopping_list;
create policy "shopping write all" on public.shopping_list
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists public.family_reports (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null unique,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.family_reports enable row level security;
drop policy if exists "family_reports read all" on public.family_reports;
create policy "family_reports read all" on public.family_reports
  for select using (auth.role() = 'authenticated');
drop policy if exists "family_reports write all" on public.family_reports;
create policy "family_reports write all" on public.family_reports
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create table if not exists public.tatyana_stories (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.users(id) on delete set null,
  title text not null,
  body text not null,
  era text,
  created_at timestamptz not null default now()
);
alter table public.tatyana_stories enable row level security;
drop policy if exists "tatyana_stories read all" on public.tatyana_stories;
create policy "tatyana_stories read all" on public.tatyana_stories
  for select using (auth.role() = 'authenticated');
drop policy if exists "tatyana_stories write all" on public.tatyana_stories;
create policy "tatyana_stories write all" on public.tatyana_stories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Triggers
-- ============================================================
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists trg_goals_touch on public.goals;
create trigger trg_goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_ai_mem_touch on public.ai_memory;
create trigger trg_ai_mem_touch before update on public.ai_memory
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Seed family challenges (idempotent)
-- ============================================================
insert into public.family_challenges (title, description, reward_xp)
select 'Семейная неделя без сахара', 'Каждый день фиксируй один приём пищи без добавленного сахара.', 200
where not exists (select 1 from public.family_challenges where title = 'Семейная неделя без сахара');

insert into public.family_challenges (title, description, reward_xp)
select 'Прогулки 30 мин/день', 'Каждый член семьи отмечает прогулку.', 150
where not exists (select 1 from public.family_challenges where title = 'Прогулки 30 мин/день');
