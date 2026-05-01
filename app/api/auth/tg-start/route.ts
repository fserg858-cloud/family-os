import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/auth/tg-start
// Создаёт короткоживущий login-token (15 мин) и возвращает deeplink на бот.
// Хранит в family_events (kind='tg_login') — без отдельной миграции.

export async function POST() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const botName =
    process.env.TELEGRAM_BOT_NAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }
  if (!botName) {
    return NextResponse.json({ error: "TELEGRAM_BOT_NAME not set" }, { status: 500 });
  }

  const token = randomBytes(12).toString("hex");
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const sb = createAdminClient();
  const { error } = await sb.from("family_events").insert({
    kind: "tg_login",
    payload: {
      token,
      expires_at,
      tg_user_id: null,
      tg_first_name: null,
      tg_last_name: null,
      tg_username: null,
      consumed: false,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deeplink = `https://t.me/${botName}?start=${token}`;
  return NextResponse.json({ token, deeplink, bot_name: botName });
}
