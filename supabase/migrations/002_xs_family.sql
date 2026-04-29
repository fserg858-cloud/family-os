-- 002_xs_family.sql — поля для XS.Family редизайна
-- Идемпотентно, можно прогнать повторно

-- ============================================================
-- family_tasks: категория, приоритет, баллы, заметка, повтор, мульти-исполнители
-- ============================================================
alter table public.family_tasks
  add column if not exists category text default 'other',
  add column if not exists priority text default 'med' check (priority in ('low','med','high')),
  add column if not exists points int default 10,
  add column if not exists notes text,
  add column if not exists recurrence text default 'none' check (recurrence in ('none','daily','weekly','monthly')),
  add column if not exists assignees uuid[] default '{}';

-- индекс для фильтрации по категориям и статусу
create index if not exists idx_family_tasks_status on public.family_tasks(status);
create index if not exists idx_family_tasks_category on public.family_tasks(category);
create index if not exists idx_family_tasks_due on public.family_tasks(due_at);

-- ============================================================
-- shopping_list: категория
-- ============================================================
alter table public.shopping_list
  add column if not exists category text default 'other';

-- ============================================================
-- notifications: личные уведомления
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

drop policy if exists "notifications owner all" on public.notifications;
create policy "notifications owner all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications insert any auth" on public.notifications;
create policy "notifications insert any auth" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

-- ============================================================
-- achievements seed catalog (общесемейный, через payload)
-- ============================================================
-- ничего нового — таблица уже создана в 001

-- ============================================================
-- Backfill defaults для существующих строк (если миграция 001 уже была)
-- ============================================================
update public.family_tasks set category = 'other' where category is null;
update public.family_tasks set priority = 'med' where priority is null;
update public.family_tasks set points = coalesce(reward_xp, 10) where points is null;
update public.family_tasks set recurrence = 'none' where recurrence is null;
update public.shopping_list set category = 'other' where category is null;
