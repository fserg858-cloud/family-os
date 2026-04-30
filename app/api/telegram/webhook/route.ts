import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, sendChatAction } from "@/lib/telegram-bot";
import { findAuthUserByTgId, answerAsAssistant } from "@/lib/agent/personal";
import { notifyFamily } from "@/lib/agent/notify";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";

export const runtime = "nodejs";
export const maxDuration = 60;

const HELP = `XS.Family — что умеет бот:

/today — задачи и привычки на сегодня
/task <текст> — создать задачу (например: /task купить хлеб)
/buy <товар> — добавить в список покупок (например: /buy молоко 2 шт)
/done — список открытых задач с номерами
/done N — закрыть задачу №N
/xp — твой уровень, XP и стрики
/menu — AI-меню недели
/calendar — ближайшие семейные события
/help — это сообщение

Любое другое сообщение — обращение к семейному AI-ассистенту 🤖
Я знаю твой контекст: цели, привычки, здоровье, настроение.`;

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
  const chatId = msg?.chat?.id;
  if (!from || !text || !chatId) return NextResponse.json({ ok: true });

  // 1) Login deeplink: /start <token>
  const loginMatch = text.match(/^\/start\s+([a-z0-9]+)\s*$/i);
  if (loginMatch) {
    return await handleLogin(botToken, chatId, msg, from, loginMatch[1]);
  }

  // Авторизация по tg_user_id
  const authUser = await findAuthUserByTgId(from.id);
  const userId: string | null = authUser?.id ?? null;

  // 2) /start (без токена)
  if (text.trim() === "/start") {
    if (userId) {
      await sendMessage(
        botToken,
        chatId,
        `Привет, ${from.first_name ?? "друг"}! Ты уже в системе. Напиши /help чтобы увидеть команды или просто задай вопрос — я твой AI-ассистент.`,
      );
    } else {
      await sendMessage(
        botToken,
        chatId,
        "Привет! Открой https://family-os-silk.vercel.app/login и нажми «Войти через Telegram» — это создаст ссылку с кодом, после которой бот тебя узнает.",
      );
    }
    return NextResponse.json({ ok: true });
  }

  // 3) /help
  if (text.trim() === "/help") {
    await sendMessage(botToken, chatId, HELP);
    return NextResponse.json({ ok: true });
  }

  // Все следующие команды требуют авторизации
  if (!userId) {
    await sendMessage(
      botToken,
      chatId,
      "Сначала залогинься: открой https://family-os-silk.vercel.app/login и нажми «Войти через Telegram».",
    );
    return NextResponse.json({ ok: true });
  }

  // 4) /today
  if (text.trim() === "/today") {
    return await handleToday(botToken, chatId, userId);
  }

  // 5) /task <text>
  const taskMatch = text.match(/^\/task\s+(.+)$/i);
  if (taskMatch) {
    return await handleCreateTask(botToken, chatId, userId, taskMatch[1].trim(), from.first_name ?? "");
  }

  // 6) /buy <text>
  const buyMatch = text.match(/^\/buy\s+(.+)$/i);
  if (buyMatch) {
    return await handleAddShopping(botToken, chatId, userId, buyMatch[1].trim(), from.first_name ?? "");
  }

  // 7) /done [N]
  const doneMatch = text.match(/^\/done(?:\s+(\d+))?\s*$/i);
  if (doneMatch) {
    return await handleDone(botToken, chatId, userId, doneMatch[1] ? parseInt(doneMatch[1], 10) : null, from.first_name ?? "");
  }

  // 8) /xp
  if (text.trim() === "/xp") {
    return await handleXp(botToken, chatId, userId);
  }

  // 9) /menu
  if (text.trim() === "/menu") {
    await sendMessage(
      botToken,
      chatId,
      "Открой меню недели на сайте: https://family-os-silk.vercel.app/menu — там AI-генератор с КБЖУ и автоматическим списком покупок.",
    );
    return NextResponse.json({ ok: true });
  }

  // 10) /calendar
  if (text.trim() === "/calendar") {
    return await handleCalendar(botToken, chatId, userId);
  }

  // 11) Любой другой текст → AI-ассистент
  await sendChatAction(botToken, chatId, "typing");
  try {
    const reply = await answerAsAssistant(userId, text);
    await sendMessage(botToken, chatId, reply);
  } catch (e: any) {
    await sendMessage(
      botToken,
      chatId,
      `Не получилось обработать запрос: ${e?.message ?? "ошибка"}. Попробуй ещё раз через минуту.`,
    );
  }
  return NextResponse.json({ ok: true });
}

// ============================================================
// HANDLERS
// ============================================================

async function handleLogin(
  botToken: string,
  chatId: number,
  msg: any,
  from: any,
  token: string,
) {
  const sb = createAdminClient();
  const { data: events } = await sb
    .from("family_events")
    .select("id, payload, created_at")
    .eq("kind", "tg_login")
    .order("created_at", { ascending: false })
    .limit(200);

  const row = (events ?? []).find((e: any) => e.payload?.token === token);
  if (!row) {
    await sendMessage(botToken, chatId, "Этот код уже не действителен. Открой /login заново.");
    return NextResponse.json({ ok: true });
  }
  const p = row.payload || {};
  if (p.consumed) {
    await sendMessage(botToken, chatId, "Эта ссылка уже использована.");
    return NextResponse.json({ ok: true });
  }
  const expiresAt = p.expires_at ? new Date(p.expires_at).getTime() : 0;
  if (expiresAt && expiresAt < Date.now()) {
    await sendMessage(botToken, chatId, "Срок действия ссылки истёк (15 мин). Открой /login заново.");
    return NextResponse.json({ ok: true });
  }

  const updated = {
    ...p,
    tg_user_id: String(from.id),
    tg_first_name: from.first_name ?? null,
    tg_last_name: from.last_name ?? null,
    tg_username: from.username ?? null,
  };
  await sb.from("family_events").update({ payload: updated }).eq("id", row.id);
  await sendMessage(
    botToken,
    chatId,
    `Готово, ${from.first_name ?? "друг"}! Возвращайся на вкладку XS.Family — она сама обновится.\n\nЗдесь, в боте, я тоже работаю — напиши /help чтобы увидеть команды.`,
  );
  return NextResponse.json({ ok: true });
}

async function handleToday(botToken: string, chatId: number, userId: string) {
  const sb = createAdminClient();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const [{ data: tasks }, { data: habits }, { data: doneToday }] = await Promise.all([
    sb
      .from("family_tasks")
      .select("title, status, due_at")
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .neq("status", "done")
      .or(`due_at.is.null,and(due_at.gte.${dayStart},due_at.lt.${dayEnd})`)
      .order("due_at", { ascending: true })
      .limit(15),
    sb.from("habits").select("id, title, streak").eq("user_id", userId).eq("active", true),
    sb.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_on", todayISO),
  ]);

  const lines: string[] = [`📅 Сегодня, ${todayISO}`];
  if ((tasks ?? []).length === 0) {
    lines.push("\n🎯 Задач нет — свободный день!");
  } else {
    lines.push("\n🎯 Задачи:");
    (tasks ?? []).forEach((t: any, i: number) => {
      const time = t.due_at ? ` ⏰ ${new Date(t.due_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "";
      lines.push(`  ${i + 1}. ${t.title}${time}`);
    });
  }

  const doneIds = new Set((doneToday ?? []).map((d: any) => d.habit_id));
  if ((habits ?? []).length > 0) {
    lines.push("\n🔥 Привычки:");
    (habits ?? []).forEach((h: any) => {
      const done = doneIds.has(h.id);
      lines.push(`  ${done ? "✅" : "⬜"} ${h.title} (стрик ${h.streak ?? 0})`);
    });
  }

  await sendMessage(botToken, chatId, lines.join("\n"));
  return NextResponse.json({ ok: true });
}

async function handleCreateTask(
  botToken: string,
  chatId: number,
  userId: string,
  title: string,
  whoFirstName: string,
) {
  const sb = createAdminClient();
  const { data: created, error } = await sb
    .from("family_tasks")
    .insert({
      created_by: userId,
      assigned_to: userId,
      title,
      category: "other",
      priority: "med",
      points: 10,
      reward_xp: 10,
      status: "open",
    })
    .select()
    .single();
  if (error) {
    await sendMessage(botToken, chatId, `Не получилось: ${error.message}`);
    return NextResponse.json({ ok: true });
  }
  await sb.from("family_events").insert({
    actor_id: userId,
    kind: "task_created",
    payload: { title: created.title, source: "telegram" },
  });
  await sendMessage(botToken, chatId, `✅ Задача создана: «${title}»\n+10 XP при выполнении.`);
  await notifyFamily({
    exceptUserId: userId,
    text: `🆕 ${whoFirstName || "Кто-то"} добавил задачу: «${title}»`,
  });
  return NextResponse.json({ ok: true });
}

async function handleAddShopping(
  botToken: string,
  chatId: number,
  userId: string,
  raw: string,
  whoFirstName: string,
) {
  // Поддержка формата "молоко 2 шт"
  const sb = createAdminClient();
  const item = raw.replace(/\s+\d+(\s*\w+)?\s*$/, "").trim();
  const qtyMatch = raw.match(/(\d+(?:\s*\w+)?)\s*$/);
  const qty = qtyMatch ? qtyMatch[1].trim() : null;

  const { data, error } = await sb
    .from("shopping_list")
    .insert({ added_by: userId, item: item || raw, qty, category: "other" })
    .select()
    .single();
  if (error) {
    await sendMessage(botToken, chatId, `Не получилось: ${error.message}`);
    return NextResponse.json({ ok: true });
  }
  await sb.from("family_events").insert({
    actor_id: userId,
    kind: "shopping_added",
    payload: { item: data.item, qty, source: "telegram" },
  });
  await sendMessage(botToken, chatId, `🛒 Добавил в список: «${data.item}»${qty ? ` (${qty})` : ""}`);
  await notifyFamily({
    exceptUserId: userId,
    text: `🛒 ${whoFirstName || "Кто-то"} добавил в список покупок: ${data.item}${qty ? ` (${qty})` : ""}`,
  });
  return NextResponse.json({ ok: true });
}

async function handleDone(
  botToken: string,
  chatId: number,
  userId: string,
  index: number | null,
  whoFirstName: string,
) {
  const sb = createAdminClient();
  const { data: tasks } = await sb
    .from("family_tasks")
    .select("id, title, points, reward_xp")
    .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    .neq("status", "done")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!tasks || tasks.length === 0) {
    await sendMessage(botToken, chatId, "У тебя нет открытых задач.");
    return NextResponse.json({ ok: true });
  }

  if (index == null) {
    const lines: string[] = ["Открытые задачи (отправь /done N):"];
    tasks.forEach((t: any, i: number) => lines.push(`  ${i + 1}. ${t.title}`));
    await sendMessage(botToken, chatId, lines.join("\n"));
    return NextResponse.json({ ok: true });
  }

  if (index < 1 || index > tasks.length) {
    await sendMessage(botToken, chatId, `Номер ${index} вне диапазона. Открыто ${tasks.length} задач.`);
    return NextResponse.json({ ok: true });
  }

  const t: any = tasks[index - 1];
  await sb.from("family_tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", t.id);

  const reward = t.points ?? t.reward_xp ?? XP_REWARDS.task_complete;
  const { data: profile } = await sb.from("users").select("xp, display_name").eq("id", userId).single();
  if (profile) {
    const newXp = (profile as any).xp + reward;
    await sb
      .from("users")
      .update({ xp: newXp, level: levelFromXp(newXp) })
      .eq("id", userId);
  }
  await sb.from("family_events").insert({
    actor_id: userId,
    kind: "task_completed",
    payload: { title: t.title, xp: reward, source: "telegram" },
  });

  await sendMessage(botToken, chatId, `✅ «${t.title}» выполнено! +${reward} XP`);
  await notifyFamily({
    exceptUserId: userId,
    text: `🎉 ${whoFirstName || "Кто-то"} закрыл задачу: «${t.title}» (+${reward} XP)`,
  });
  return NextResponse.json({ ok: true });
}

async function handleXp(botToken: string, chatId: number, userId: string) {
  const sb = createAdminClient();
  const [{ data: profile }, { data: habits }] = await Promise.all([
    sb.from("users").select("display_name, xp, level, streak_days, member_key").eq("id", userId).single(),
    sb.from("habits").select("title, streak").eq("user_id", userId).eq("active", true).order("streak", { ascending: false }).limit(5),
  ]);
  if (!profile) {
    await sendMessage(botToken, chatId, "Профиль не найден.");
    return NextResponse.json({ ok: true });
  }
  const p: any = profile;
  const into = p.xp - (p.level - 1) * 200;
  const lines = [
    `🎮 ${p.display_name}`,
    `Уровень ${p.level} · ${p.xp} XP`,
    `До следующего уровня: ${200 - into} XP`,
  ];
  if (p.streak_days > 0) lines.push(`🔥 Стрик дней: ${p.streak_days}`);
  if ((habits ?? []).length > 0) {
    lines.push("\nТоп привычек:");
    (habits ?? []).forEach((h: any) => lines.push(`  • ${h.title} — стрик ${h.streak}`));
  }
  await sendMessage(botToken, chatId, lines.join("\n"));
  return NextResponse.json({ ok: true });
}

async function handleCalendar(botToken: string, chatId: number, userId: string) {
  const sb = createAdminClient();
  const now = new Date().toISOString();
  const { data: events } = await sb
    .from("family_calendar")
    .select("title, starts_at, location, notes")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(10);

  if (!events || events.length === 0) {
    await sendMessage(
      botToken,
      chatId,
      "📅 Ближайших событий нет.\n\nДобавить можно на https://family-os-silk.vercel.app/calendar",
    );
    return NextResponse.json({ ok: true });
  }

  const lines = ["📅 Ближайшие события:"];
  events.forEach((e: any) => {
    const d = new Date(e.starts_at);
    const dt = d.toLocaleString("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
    lines.push(`\n• ${dt} — ${e.title}${e.location ? ` 📍 ${e.location}` : ""}`);
    if (e.notes) lines.push(`  ${e.notes}`);
  });
  await sendMessage(botToken, chatId, lines.join("\n"));
  return NextResponse.json({ ok: true });
}
