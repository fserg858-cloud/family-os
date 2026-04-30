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

interface Body {
  tg_data: Record<string, unknown>;
  member_key?: string;
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN env var is not set" },
      { status: 500 },
    );
  }

  const { tg_data, member_key } = (await req.json()) as Body;

  if (!tg_data || typeof tg_data !== "object" || !tg_data.id || !tg_data.hash) {
    return NextResponse.json({ error: "tg_data missing required fields" }, { status: 400 });
  }
  if (!validateTelegramAuth(tg_data, botToken)) {
    return NextResponse.json({ error: "invalid telegram signature" }, { status: 401 });
  }
  if (!isAuthDateFresh(Number(tg_data.auth_date))) {
    return NextResponse.json({ error: "auth_date expired" }, { status: 401 });
  }

  const sb = createAdminClient();
  const tgId = String(tg_data.id);
  const email = telegramEmail(tgId);
  const password = deriveTelegramPassword(tgId, botToken);

  // Ищем существующего auth-пользователя по этому email
  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) {
    return NextResponse.json({ error: list.error.message }, { status: 500 });
  }
  let authUser = list.data.users.find((u) => u.email === email);

  const firstName = String(tg_data.first_name ?? "").trim();
  const lastName = String(tg_data.last_name ?? "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || `tg_${tgId}`;
  const photoUrl = typeof tg_data.photo_url === "string" ? tg_data.photo_url : null;

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
        username: tg_data.username ?? null,
        photo_url: photoUrl,
        member_key: member_key ?? "fedor",
      },
    });
    if (created.error || !created.data.user) {
      return NextResponse.json(
        { error: created.error?.message ?? "failed to create user" },
        { status: 500 },
      );
    }
    authUser = created.data.user;
  } else {
    // Сбрасываем пароль на детерминистический (он мог измениться при ротации bot token).
    await sb.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
    });
  }

  // Гарантируем строку в public.users.
  const m =
    (member_key && MEMBERS[member_key as MemberKey]) || MEMBERS.fedor;

  const { data: existing } = await sb
    .from("users")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  const profilePayload = {
    id: authUser.id,
    email,
    member_key: m.key,
    display_name: displayName,
    age: m.age,
    ui_profile: m.ui_profile,
    avatar: photoUrl,
  };

  if (!existing) {
    await sb.from("users").insert(profilePayload);
  } else if (member_key) {
    // На /register пользователь явно выбирает member_key — обновляем профиль.
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

  return NextResponse.json({ ok: true, email, password });
}
