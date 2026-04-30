# Один копи-паст для Supabase

`/setup`-страница исчезла — Vercel env-переменные выставлены ✓

Осталось одно действие — применить SQL.

## Шаг 1. Применить миграции в Supabase

Открой:
**https://supabase.com/dashboard/project/kuinruimnpnxhbpdjohj/sql/new**

Открой файл `supabase/migrations/ALL.sql` (он содержит все 3 миграции
склеенные в один блок), скопируй ВСЁ содержимое целиком,
вставь в SQL Editor, нажми зелёную кнопку **Run**.

Это создаст 22 таблицы, RLS-политики, индексы, триггеры и засеет
2 семейных челленджа. Идемпотентно — можно прогнать повторно.

## Шаг 2. Включить Email auth

**https://supabase.com/dashboard/project/kuinruimnpnxhbpdjohj/auth/providers**

Email Provider → Enabled.
В **Settings → Email** выключи `Confirm email` (для удобства разработки —
регистрация не будет требовать подтверждения почты).

## Шаг 3. Готово

Открой https://family-os-silk.vercel.app/register — выбери своего
участника (аватар), email + пароль, **Создать аккаунт**. Дальше:

- `/dashboard` — приветствие, ProgressRing, аватары семьи, задачи, лента
- `/tasks` + `/tasks/create` — задачи со свайпом
- `/family` — карусель аватаров
- `/shopping` — общий список продуктов
- `/profile` — твой профиль с XP, ачивки, разделы
- `/events` — лента семейной активности по дням
- `/notifications` — уведомления
- `/assistant` — AI-чат (потоковый, claude-opus-4-7)
- `/memory` — паттерны и решения которые AI запомнил о тебе
- `/habits`, `/goals`, `/health`, `/reflection`, `/growth`, `/report`

Cron-задачи в `vercel.json` запустятся автоматически:
- проактивные сообщения каждые 2 часа
- семейная аналитика в 23:00 ежедневно
- обновление context-cache каждые 6 часов
