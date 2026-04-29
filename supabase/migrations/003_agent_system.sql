-- 003_agent_system.sql — самообучающийся агент: паттерны, решения, проактив, обучение, кэш контекста
-- Идемпотентно. Не использует pgvector (только keyword-based memory).

create extension if not exists pgcrypto;

-- ============================================================
-- agent_patterns — поведенческие паттерны
-- ============================================================
create table if not exists public.agent_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  pattern_type text not null check (pattern_type in ('behavior','preference','trigger','correlation','ritual')),
  pattern_key text not null,
  pattern_data jsonb not null default '{}'::jsonb,
  confidence float not null default 0.5 check (confidence between 0 and 1),
  occurrences int not null default 1,
  last_confirmed_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, pattern_key)
);
alter table public.agent_patterns enable row level security;
drop policy if exists "own_patterns" on public.agent_patterns;
create policy "own_patterns" on public.agent_patterns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_agent_patterns_user on public.agent_patterns(user_id);
create index if not exists idx_agent_patterns_confidence on public.agent_patterns(confidence desc);

-- ============================================================
-- agent_decisions — кэш решений на повторяющиеся вопросы
-- ============================================================
create table if not exists public.agent_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  question_normalized text not null,
  context_snapshot jsonb not null default '{}'::jsonb,
  decision text not null,
  reasoning text,
  outcome text check (outcome in ('positive','negative','pending')) default 'pending',
  used_count int default 0,
  created_at timestamptz default now()
);
alter table public.agent_decisions enable row level security;
drop policy if exists "own_decisions" on public.agent_decisions;
create policy "own_decisions" on public.agent_decisions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_agent_decisions_user on public.agent_decisions(user_id);

-- ============================================================
-- agent_proactive_messages
-- ============================================================
create table if not exists public.agent_proactive_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  trigger_type text not null,
  trigger_data jsonb default '{}'::jsonb,
  message text not null,
  priority int default 5 check (priority between 1 and 10),
  sent_at timestamptz default now(),
  read_at timestamptz,
  acted_upon boolean default false,
  dismissed boolean default false
);
alter table public.agent_proactive_messages enable row level security;
drop policy if exists "own_proactive" on public.agent_proactive_messages;
create policy "own_proactive" on public.agent_proactive_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- сервисный insert для cron / Service Role
drop policy if exists "service_insert_proactive" on public.agent_proactive_messages;
create policy "service_insert_proactive" on public.agent_proactive_messages for insert with check (true);
create index if not exists idx_proactive_unread on public.agent_proactive_messages(user_id) where read_at is null;

-- ============================================================
-- agent_learning_log — лог событий для обучения
-- ============================================================
create table if not exists public.agent_learning_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  extracted_patterns jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.agent_learning_log enable row level security;
drop policy if exists "own_learning" on public.agent_learning_log;
create policy "own_learning" on public.agent_learning_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_learning_log_user on public.agent_learning_log(user_id, event_type);

-- ============================================================
-- agent_context_cache
-- ============================================================
create table if not exists public.agent_context_cache (
  user_id uuid primary key references public.users(id) on delete cascade,
  habits_summary jsonb default '[]'::jsonb,
  goals_summary jsonb default '[]'::jsonb,
  health_trends jsonb default '{}'::jsonb,
  mood_trend float default 5,
  top_patterns jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table public.agent_context_cache enable row level security;
drop policy if exists "own_cache" on public.agent_context_cache;
create policy "own_cache" on public.agent_context_cache for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- family_intelligence_log — общесемейная аналитика, читают все авторизованные
-- ============================================================
create table if not exists public.family_intelligence_log (
  id uuid primary key default gen_random_uuid(),
  analysis_date date not null unique,
  participants_data jsonb not null default '{}'::jsonb,
  insights jsonb default '[]'::jsonb,
  conflicts jsonb default '[]'::jsonb,
  suggestions jsonb default '[]'::jsonb,
  weekly_report jsonb,
  created_at timestamptz default now()
);
alter table public.family_intelligence_log enable row level security;
drop policy if exists "family_read_intel" on public.family_intelligence_log;
create policy "family_read_intel" on public.family_intelligence_log for select using (auth.uid() is not null);
drop policy if exists "service_write_intel" on public.family_intelligence_log;
create policy "service_write_intel" on public.family_intelligence_log for all using (true) with check (true);

-- ============================================================
-- Совместимость со схемой агента: добавляем колонки в ai_memory и ai_conversations
-- ============================================================
alter table public.ai_memory
  add column if not exists memory_type text default 'fact',
  add column if not exists content text;
update public.ai_memory set content = value where content is null;

alter table public.ai_conversations
  add column if not exists messages jsonb default '[]'::jsonb;

-- mood в health_logs (для совместимости с агентом, который ждёт payload.value)
-- ничего не меняем, агент будет читать из reflections.mood

-- last_done в habits удобно денормализованно держать
alter table public.habits
  add column if not exists last_done date;

-- helper: bump used_count + outcome
create or replace function public.bump_decision(p_id uuid, p_outcome text)
returns void language sql as $$
  update public.agent_decisions
  set outcome = p_outcome,
      used_count = coalesce(used_count, 0) + 1
  where id = p_id;
$$;
