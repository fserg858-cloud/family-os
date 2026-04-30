import Link from "next/link";

interface Props {
  memberKey?: string;
  label?: string;
}

// Простая кнопка-ссылка которая запускает Telegram OAuth flow на сервере.
// Не требует NEXT_PUBLIC_TELEGRAM_BOT_NAME — работает только с серверным TELEGRAM_BOT_TOKEN.

export function TelegramButton({ memberKey, label = "Войти через Telegram" }: Props) {
  const href = memberKey
    ? `/api/auth/tg-init?member_key=${encodeURIComponent(memberKey)}`
    : "/api/auth/tg-init";

  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-medium transition-transform active:scale-[0.98]"
      style={{ background: "#2AABEE" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          d="M21.94 4.34l-3.05 14.4c-.23 1.02-.83 1.27-1.68.79l-4.65-3.43-2.24 2.16c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L7.06 11.7l-4.63-1.45c-1.01-.32-1.03-1.01.21-1.5L20.5 2.66c.84-.32 1.58.2 1.44 1.68z"
          fill="currentColor"
        />
      </svg>
      {label}
    </Link>
  );
}
