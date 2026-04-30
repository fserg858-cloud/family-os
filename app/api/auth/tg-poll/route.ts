import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveTelegramPassword, telegramEmail } from "@/lib/telegram";
import { MEMBERS, type MemberKey } from "@/lib/members";

export const runtime = "nodejs";

// GET /api/auth/tg-poll?token=xxx
// Опрашивается с клиента раз в секунду. Когда webhook привязал tg_user_id —
// создаём auth-юзера, генерируем magic-link и возвращаем его в JSON.
// Клиент делает window.location = magic_link → Supabase сам поставит cookie
// и зальёт юзера на /dashboard.

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const sb = createAdminClient();
  const { data: row, error } = await sb
    .from("tg_login_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ status: "expired" }, { status: 404 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ status: "expired" });
  }
  if (!row.tg_user_id) {
    return NextResponse.json({ status: "pending" });
  }
  if (row.consumed_at) {
    return NextResponse.json({ status: "expired" });
  }

  // Связь есть — создаём/находим auth-юзера и возвращаем magic-link.
  const tgId = String(row.tg_user_id);
  const email = telegramEmail(tgId);
  const password = deriveTelegramPassword(tgId, botToken);

  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) {
    return NextResponse.json({ error: list.error.message }, { status: 500 });
  }
  let authUser = list.data.users.find((u) => u.email === email);

  const firstName = (row.tg_first_name ?? "").trim();
  const lastName = (row.tg_last_name ?? "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || `tg_${tgId}`;

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
        username: row.tg_username ?? null,
        member_key: row.member_key ?? "fedor",
      },
    });
    if (created.error || !created.data.user) {
      return NextResponse.json(
        { error: created.error?.message ?? "createUser failed" },
        { status: 500 },
      );
    }
    authUser = created.data.user;
  } else {
    await sb.auth.admin.updateUserById(authUser.id, { password, email_confirm: true });
  }

  const m = (row.member_key && MEMBERS[row.member_key as MemberKey]) || MEMBERS.fedor;

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
      avatar: row.tg_photo_url ?? null,
    });
  } else if (row.member_key) {
    await sb
      .from("users")
      .update({
        member_key: m.key,
        display_name: displayName,
        age: m.age,
        ui_profile: m.ui_profile,
      })
      .eq("id", authUser.id);
  }

  // Magic link
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || `${url.protocol}//${url.host}`;
  const link = await sb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/dashboard` },
  });
  if (link.error || !link.data?.properties?.action_link) {
    return NextResponse.json(
      { error: link.error?.message ?? "no action_link" },
      { status: 500 },
    );
  }

  // Помечаем токен использованным, чтобы повторно не сработал
  await sb
    .from("tg_login_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.json({
    status: "ok",
    redirect: link.data.properties.action_link,
  });
}
