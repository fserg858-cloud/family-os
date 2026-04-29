# Family OS

Семейная операционная система. Стек: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase Auth + PostgreSQL, Anthropic Claude API.

## Установка

```bash
npm install
```

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

## Применение миграций

В Supabase SQL Editor выполните содержимое `supabase/migrations/001_initial.sql` целиком.

Альтернатива через Supabase CLI:
```bash
supabase db push
```

## Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## Участники семьи (роли регистрации)

| Ключ      | Имя        | Возраст | UI      |
|-----------|-----------|---------|---------|
| fedor     | Фёдор     | 18      | default |
| ignat     | Игнат     | 14      | teen    |
| nikolay   | Николай   | 45      | default |
| elena     | Елена     | 43      | default |
| tatyana   | Татьяна   | 70      | elder   |

## Маршруты

- `/login`, `/register` — публичные
- `/dashboard` — утренний брифинг и приоритеты
- `/goals` — цели по горизонтам
- `/habits` — привычки и стрики
- `/health` — питание / сон / тренировки / метрики / вода
- `/assistant` — AI-чат с Claude
- `/growth` — компетенции и материалы
- `/reflection` — вечерняя рефлексия
- `/family` — лента, задачи, продукты, челленджи, рейтинг
- `/report` — еженедельный отчёт

## Безопасность

- `.env.local` в `.gitignore` — не коммитьте секреты
- RLS включён для всех таблиц: личные таблицы видит только владелец, семейные — все авторизованные

## Геймификация

- Привычка: +10 XP за лог
- Рефлексия: +20 XP в день
- Цель: +50 XP при завершении
- Задача: +reward_xp при `done`
- Челлендж: +25 XP за шаг, +reward_xp за полное завершение
- Уровень: каждые 200 XP
