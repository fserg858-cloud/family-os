import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/auth/tg-start { member_key?: string }
// Создаёт короткоживущий login-token (15 мин) и возвращает deeplink на бот.
// Дальше клиент откроет t.me/<bot>?start=<token>, юзер нажмёт Start —
// бот через webhook привяжет tg_user_id к токену.

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }
  if (!botName) {
    return NextResponse.json({ error: "NEXT_PUBLIC_TELEGRAM_BOT_NAME not set" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const memberKey = typeof body.member_key === "string" ? body.member_key : null;

  // 24 hex chars — достаточно энтропии, безопасно для t.me URL
  const token = randomBytes(12).toString("hex");

  const sb = createAdminClient();
  const { error } = await sb.from("tg_login_tokens").insert({
    token,
    member_key: memberKey,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deeplink = `https://t.me/${botName}?start=${token}`;
  return NextResponse.json({ token, deeplink, bot_name: botName });
}
