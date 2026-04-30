// Утилиты для отправки сообщений через Telegram Bot API.
// Используется webhook'ом и broadcast-нотификациями семье.

const TG = "https://api.telegram.org";

export async function sendMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  opts: { parse_mode?: "HTML" | "MarkdownV2"; disable_notification?: boolean } = {},
): Promise<void> {
  try {
    await fetch(`${TG}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...opts,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function sendChatAction(
  botToken: string,
  chatId: number | string,
  action: "typing" | "upload_photo" = "typing",
): Promise<void> {
  try {
    await fetch(`${TG}/bot${botToken}/sendChatAction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    /* ignore */
  }
}
