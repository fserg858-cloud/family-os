import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateTelegramAuth,
  isAuthDateFresh,
  deriveTelegramPassword,
  telegramEmail,
} from "@/lib/telegram";
import { MEMBERS, type MemberKey } from "@/lib/members";

export const runtime = "nodejs";

// GET /api/auth/tg-callback?id=...&first_name=...&hash=...&member_key=...
// Telegram редиректит сюда после OAuth-confirmation.
// 1) валидируем подпись
// 2) создаём/обновляем auth-юзера + public.users через service_role
// 3) генерируем magic-link (admin.generateLink), 302 на него — Supabase сам поставит cookie и редиректнёт на /dashboard

function htmlError(message: string, code = 400): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Telegram Login</title>
<style>body{background:#1C1C1E;color:#FFF;font-family:system-ui;padding:40px;max-width:500px;margin:0 auto}
a{color:#FF6B8A;text-decoration:none}
.box{background:#2C2C2E;border:1px solid #FF3B30;border-radius:16px;padding:24px}
</style></head><body>
<div class="box">
<h1 style="margin:0 0 12px 0;font-size:18px">Не удалось войти через Telegram</h1>
<p style="margin:0 0 16px 0;color:#8E8E93;font-size:14px">${message}</p>
<a href="/login">← Назад к входу</a>
</div></body></html>`;
  return new NextResponse(html, {
    status: code,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return htmlError("TELEGRAM_BOT_TOKEN env var is not set", 500);

  const url = new URL(req.url);
  const data: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    data[k] = v;
  });
  const memberKey = data.member_key;
  delete data.member_key;

  if (!data.hash || !data.id) {
    return htmlError("Telegram не передал параметры авторизации");
  }
  if (!validateTelegramAuth(data, token)) {
    return htmlError("Подпись Telegram не прошла проверку (проверь /setdomain в @BotFather)");
  }
  if (!isAuthDateFresh(Number(data.auth_date))) {
    return htmlError("auth_date просрочен, попробуй ещё раз");
  }

  const sb = createAdminClient();
  const tgId = String(data.id);
  const email = telegramEmail(tgId);
  const password = deriveTelegramPassword(tgId, token);

  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) return htmlError(`listUsers: ${list.error.message}`, 500);

  let authUser = list.data.users.find((u) => u.email === email);

  const firstName = (data.first_name ?? "").trim();
  const lastName = (data.last_name ?? "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || `tg_${tgId}`;
  const photoUrl = data.photo_url ?? null;

  if (!authUser) {
    const created = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        provider: "telegram",
        telegram_id: tgId,
        first_name: firstName,
        last_name: lastName,
        username: data.username ?? null,
        photo_url: photoUrl,
        member_key: memberKey ?? "fedor",
      },
    });
    if (created.error || !created.data.user) {
      return htmlError(`createUser: ${created.error?.message ?? "unknown"}`, 500);
    }
    authUser = created.data.user;
  } else {
    await sb.auth.admin.updateUserById(authUser.id, { password, email_confirm: true });
  }

  const m = (memberKey && MEMBERS[memberKey as MemberKey]) || MEMBERS.fedor;

  const { data: existing } = await sb
    .from("users")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!existing) {
    await sb.from("users").insert({
      id: authUser.id,
      email,
      member_key: m.key,
      display_name: displayName,
      age: m.age,
      ui_profile: m.ui_profile,
      avatar: photoUrl,
    });
  } else if (memberKey) {
    await sb
      .from("users")
      .update({
        member_key: m.key,
        display_name: displayName,
        age: m.age,
        ui_profile: m.ui_profile,
        avatar: photoUrl,
      })
      .eq("id", authUser.id);
  }

  // Генерируем magic-link через Admin API. Переход по нему установит session cookies
  // и сам отредиректит на redirectTo.
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `${url.protocol}//${url.host}`;
  const redirectTo = `${appUrl}/dashboard`;

  const link = await sb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (link.error || !link.data?.properties?.action_link) {
    return htmlError(`generateLink: ${link.error?.message ?? "no action_link"}`, 500);
  }

  return NextResponse.redirect(link.data.properties.action_link, 302);
}
