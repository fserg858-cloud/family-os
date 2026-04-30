# START HERE — 2 действия и приложение работает

`/setup` показывается, потому что в Vercel-проекте не выставлены env vars,
а в Supabase не применены миграции. Я не могу сделать это сам из своего
sandbox: api.vercel.com не входит в allowlist, у GitHub-MCP нет endpoint
запуска workflow, у Supabase-MCP моего токена нет доступа к этому проекту.

## Действие 1 — Vercel env vars (1 минута)

Открой в браузере:
**https://github.com/fserg858-cloud/family-os/actions/workflows/setup-vercel-env.yml**

Справа кнопка `Run workflow`. В форме:

- **vercel_token** → возьми токен из чата (тот что начинается на `vcp_…`).
- **env_block** → скопируй содержимое `.env.local` с твоего десктопа целиком.
  6 строк `KEY=VALUE`. Если потерял — попроси меня в чате.
- **project_id** и **team_id** — оставь дефолтными (уже подставлены).

Жми зелёную кнопку `Run workflow`.

Workflow за ~30 секунд:
1. Замаскирует токен и значения в логах (`::add-mask::`).
2. Удалит существующие env vars с теми же ключами.
3. Создаст 6 новых на Production + Preview + Development.
4. Триггернёт rebuild prod-деплоя.

После завершения `family-os-silk.vercel.app` начнёт показывать реальное
приложение вместо страницы `/setup`.

## Действие 2 — Supabase миграции (1 минута)

Открой:
**https://supabase.com/dashboard/project/kuinruimnpnxhbpdjohj/sql/new**

Прогони поочерёдно содержимое 3 файлов:
1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_xs_family.sql`
3. `supabase/migrations/003_agent_system.sql`

Каждый: copy → paste в SQL Editor → `Run`. Все три идемпотентны,
повторный прогон не сломает.

## Действие 3 (опционально) — Email auth

Supabase Dashboard → Authentication → Providers → Email = enabled.
В Authentication → Settings выключи `Confirm email` (для удобства).

После этих действий регистрация на `/register` работает целиком —
включая стриминговый AI-чат, проактивные сообщения, паттерны и
ежедневную семейную аналитику через cron.

## Что уже сделано в коде (всё запушено в эту ветку)

- ✅ XS.Family дизайн на 33 маршрутах
- ✅ TaskCard со свайпом, ProgressRing, BottomNav
- ✅ Самообучающийся AI-агент (claude-opus-4-7 / haiku-4-5)
- ✅ Стриминговый чат с памятью + страница `/memory`
- ✅ Проактивные сообщения с 5 триггерами
- ✅ Cron jobs (proactive 2h, family-intel 23:00, context-cache 6h)
- ✅ Server-side обучение от привычек, целей, рефлексии, задач, здоровья
- ✅ `/setup` фолбэк когда env-переменные не выставлены
- ✅ Build проходит локально без env, 33 + 7 агентских роута
