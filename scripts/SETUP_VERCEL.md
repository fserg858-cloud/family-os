# Как выставить env-переменные в Vercel за 30 секунд

`/setup` показывается потому что в Vercel-проекте не выставлены 6 переменных.
Я не могу записать их из своего sandbox (нет API-токена). Выбери любой вариант ниже.

## Вариант A — Bulk Import (рекомендуется, 30 секунд)

1. Открой свой локальный `.env.local` (на десктопе в папке `family-os`).
   Если его нет — скопируй из чата мои предыдущие сообщения (там 6 строк `KEY=VALUE`).
2. Открой
   https://vercel.com/fedors-projects-03aefc10/family-os/settings/environment-variables
3. Кнопка **Add Another → Import .env**.
4. Скопируй содержимое `.env.local` целиком и вставь в окно импорта.
5. Все три галочки (Production / Preview / Development) — поставь.
6. **Save**.
7. **Deployments → ⋯ → Redeploy** на последнем деплое.

После этого `/setup` исчезает, заработает реальное приложение.

## Вариант B — через Vercel CLI на твоей машине

```powershell
cd C:\Users\User\Desktop\family-os
npm i -g vercel
vercel login                                # один раз, откроется браузер
vercel link --yes --project family-os       # привязка папки к проекту
.\scripts\setup-vercel.ps1                  # читает .env.local и пушит
```

## Вариант C — дай мне Vercel API токен

Создай токен на https://vercel.com/account/tokens (займёт 30 секунд),
скинь сюда в чат и я через REST API сам выставлю все 6 переменных и
триггерну redeploy. Токен можно после удалить.

## Почему я не делаю это сам без токена

- Vercel MCP (то что у меня есть) — read-only, нет write-операций для env vars.
- Vercel CLI требует `vercel login` (интерактивный браузер) или
  `VERCEL_TOKEN` env-переменную — у меня в sandbox их нет.
- Хардкодить ключи в публичный репозиторий нельзя:
  GitHub secret scanning блокирует push, и это правильно —
  любой человек смог бы скопировать твой Anthropic ключ и тратить
  деньги, или через service_role получить полный доступ к БД.
