import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/auth/tg-init?member_key=...
// Редиректит на Telegram OAuth (то же что делает Login Widget внутри iframe).
// После подтверждения в TG юзер вернётся на /api/auth/tg-callback с подписанными параметрами.

export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN env var is not set" },
      { status: 500 },
    );
  }

  // bot_id — числовой префикс перед двоеточием в токене.
  const botId = token.split(":")[0];
  if (!/^\d+$/.test(botId)) {
    return NextResponse.json({ error: "invalid bot token format" }, { status: 500 });
  }

  const reqUrl = new URL(req.url);
  const memberKey = reqUrl.searchParams.get("member_key") ?? "";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `${reqUrl.protocol}//${reqUrl.host}`;
  const origin = new URL(appUrl).origin;

  const callbackUrl = new URL("/api/auth/tg-callback", origin);
  if (memberKey) callbackUrl.searchParams.set("member_key", memberKey);

  // Документация: https://core.telegram.org/widgets/login
  const oauth = new URL("https://oauth.telegram.org/auth");
  oauth.searchParams.set("bot_id", botId);
  oauth.searchParams.set("origin", origin);
  oauth.searchParams.set("return_to", callbackUrl.toString());
  oauth.searchParams.set("request_access", "write");
  oauth.searchParams.set("embed", "0");

  return NextResponse.redirect(oauth.toString(), 302);
}
