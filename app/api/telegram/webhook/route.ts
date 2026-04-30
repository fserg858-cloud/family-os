import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/telegram/webhook — Telegram Bot API updates.
// /start <token> → находим в family_events запись kind='tg_login' с этим token
// и записываем туда tg_user_id+имя.

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
  if (!from || !text) return NextResponse.json({ ok: true });

  const m = text.match(/^\/start\s+([a-z0-9]+)\s*$/i);
  if (!m) {
    if (text.trim() === "/start") {
      await sendMessage(
        botToken,
        msg.chat.id,
        "Привет! Чтобы войти в XS.Family — открой /login на сайте и нажми «Войти через Telegram». Это создаст рабочую ссылку.",
      );
    }
    return NextResponse.json({ ok: true });
  }

  const token = m[1];
  console.log("[tg-webhook] /start with token:", token, "from tg_user:", from.id);
  const sb = createAdminClient();

  // Найдём pending login-event
  const { data: events, error: selErr } = await sb
    .from("family_events")
    .select("id, payload, created_at")
    .eq("kind", "tg_login")
    .order("created_at", { ascending: false })
    .limit(200);
  if (selErr) {
    console.error("[tg-webhook] select failed:", selErr.message);
  }
  console.log("[tg-webhook] found", (events ?? []).length, "tg_login events");

  const row = (events ?? []).find((e: any) => e.payload?.token === token);
  if (!row) {
    console.log("[tg-webhook] token not found among", (events ?? []).map((e: any) => e.payload?.token).join(","));
    await sendMessage(botToken, msg.chat.id, "Этот код уже не действителен. Открой /login заново.");
    return NextResponse.json({ ok: true });
  }
  const p = row.payload || {};
  if (p.consumed) {
    await sendMessage(botToken, msg.chat.id, "Эта ссылка уже использована.");
    return NextResponse.json({ ok: true });
  }
  const expiresAt = p.expires_at ? new Date(p.expires_at).getTime() : 0;
  if (expiresAt && expiresAt < Date.now()) {
    await sendMessage(botToken, msg.chat.id, "Срок действия ссылки истёк (15 мин). Открой /login заново.");
    return NextResponse.json({ ok: true });
  }

  const updated = {
    ...p,
    tg_user_id: String(from.id),
    tg_first_name: from.first_name ?? null,
    tg_last_name: from.last_name ?? null,
    tg_username: from.username ?? null,
  };
  const updRes = await sb.from("family_events").update({ payload: updated }).eq("id", row.id);
  if (updRes.error) {
    console.error("[tg-webhook] update failed:", updRes.error.message);
  } else {
    console.log("[tg-webhook] updated event", row.id, "with tg_user_id", from.id);
  }

  await sendMessage(
    botToken,
    msg.chat.id,
    `Готово, ${from.first_name ?? "друг"}! Возвращайся на вкладку XS.Family — она сама обновится.`,
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
