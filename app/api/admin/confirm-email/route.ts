import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/_admin/confirm-email?email=...&secret=CRON_SECRET
// Идёт в обход email confirmation, помечает указанного пользователя как
// email_confirmed_at=now(). Защищён через CRON_SECRET в query param чтобы
// можно было нажать прямо из браузера.
//
// После того как Email confirmation выключен в Supabase Dashboard и/или
// все пользователи семьи подтверждены — этот файл можно удалить.

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const sb = createAdminClient();

  // Найдём auth-пользователя по email
  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return NextResponse.json({ error: `user not found: ${email}` }, { status: 404 });
  }

  // Подтверждаем email через Admin API
  const upd = await sb.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 500 });
  }

  // Также проверим что в public.users есть строка — auto-create через метаданные
  const meta = (user.user_metadata ?? {}) as { member_key?: string; display_name?: string };
  const memberKey = meta.member_key ?? "fedor";
  const displayName = meta.display_name ?? "Участник";
  const ageMap: Record<string, number> = { fedor: 18, ignat: 14, nikolay: 45, elena: 43, tatyana: 70 };
  const uiMap: Record<string, string> = { tatyana: "elder", ignat: "teen" };

  const { data: existingProfile } = await sb.from("users").select("id").eq("id", user.id).maybeSingle();
  if (!existingProfile) {
    await sb.from("users").insert({
      id: user.id,
      email: user.email ?? email,
      member_key: memberKey,
      display_name: displayName,
      age: ageMap[memberKey] ?? null,
      ui_profile: uiMap[memberKey] ?? "default",
    });
  }

  return NextResponse.json({
    ok: true,
    email,
    user_id: user.id,
    member_key: memberKey,
    message: "Email confirmed. Можешь зайти на /login.",
  });
}
