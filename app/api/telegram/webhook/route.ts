import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/telegram/webhook — принимает updates от Telegram Bot API.
// Защищается через X-Telegram-Bot-Api-Secret-Token (выставляем при setWebhook).
//
// Логика: если message.text начинается с "/start <token>" — связываем
// этот token с from.id, чтобы /api/auth/tg-poll мог его подобрать.
// Отвечаем юзеру в чате чтобы он понял что входим.

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (expectedSecret && headerSecret !== expectedSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "bot token missing" }, { status: 500 });
  }

  let update: any = null;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update?.message;
  const text: string | undefined = msg?.text;
  const from = msg?.from;

  if (!from || !text) {
    return NextResponse.json({ ok: true });
  }

  // Поддерживаем только "/start <token>"
  const match = text.match(/^\/start\s+([a-z0-9]+)\s*$/i);
  if (!match) {
    // Просто /start без токена — короткое приветствие
    if (text.trim() === "/start") {
      await sendMessage(
        botToken,
        msg.chat.id,
        "Привет! Чтобы войти в XS.Family, открой /login на сайте и нажми «Войти через Telegram» — это создаст рабочую ссылку.",
      );
    }
    return NextResponse.json({ ok: true });
  }

  const token = match[1];
  const sb = createAdminClient();

  const { data: row, error } = await sb
    .from("tg_login_tokens")
    .select("token, expires_at, consumed_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !row) {
    await sendMessage(botToken, msg.chat.id, "Этот код уже не действителен. Открой /login заново.");
    return NextResponse.json({ ok: true });
  }
  if (row.consumed_at) {
    await sendMessage(botToken, msg.chat.id, "Эта ссылка уже использована. Открой /login заново.");
    return NextResponse.json({ ok: true });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sendMessage(botToken, msg.chat.id, "Срок действия ссылки истёк (15 мин). Открой /login заново.");
    return NextResponse.json({ ok: true });
  }

  await sb
    .from("tg_login_tokens")
    .update({
      tg_user_id: String(from.id),
      tg_first_name: from.first_name ?? null,
      tg_last_name: from.last_name ?? null,
      tg_username: from.username ?? null,
    })
    .eq("token", token);

  await sendMessage(
    botToken,
    msg.chat.id,
    `Готово, ${from.first_name ?? "друг"}! Возвращайся на вкладку XS.Family — она сама обновится через секунду.`,
  );

  return NextResponse.json({ ok: true });
}

async function sendMessage(botToken: string, chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    /* ignore */
  }
}
