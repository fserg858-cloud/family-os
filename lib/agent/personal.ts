import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { telegramEmail } from "@/lib/telegram";
import { buildSystemPrompt } from "@/lib/agent/context";
import type { UserContext } from "@/lib/agent/types";
import { getTopPatterns } from "@/lib/agent/memory";

// Найти auth-пользователя по Telegram-id (мы при регистрации создаём
// email вида tg_<tgId>@telegram.xs-family.local)
export async function findAuthUserByTgId(tgId: string | number) {
  const sb = createAdminClient();
  const email = telegramEmail(String(tgId));
  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) return null;
  return list.data.users.find((u) => u.email === email) ?? null;
}

// Сборка контекста пользователя по auth user_id (без cookies, через admin)
export async function buildUserContextById(userId: string): Promise<UserContext | null> {
  const sb = createAdminClient();
  const { data: userData } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
  if (!userData) return null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [
    { data: habits },
    { data: habitLogs },
    { data: goals },
    { data: healthLogs },
    { data: reflections },
    { data: recentMemory },
    topPatterns,
  ] = await Promise.all([
    sb.from("habits").select("*").eq("user_id", userId).eq("active", true),
    sb.from("habit_logs").select("habit_id, done_on").eq("user_id", userId).gte("done_on", sevenDaysAgo),
    sb.from("goals").select("*").eq("user_id", userId).eq("status", "active"),
    sb.from("health_logs").select("*").eq("user_id", userId).gte("occurred_on", sevenDaysAgo).order("occurred_on", { ascending: false }),
    sb.from("reflections").select("occurred_on, mood").eq("user_id", userId).gte("occurred_on", sevenDaysAgo).order("occurred_on", { ascending: false }),
    sb.from("ai_memory").select("memory_type, content, value, key, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    getTopPatterns(userId, 10),
  ]);

  const habits_summary = (habits ?? []).map((h: any) => ({
    habit: h.title,
    done_count: (habitLogs ?? []).filter((l: any) => l.habit_id === h.id).length,
    streak: h.streak ?? 0,
    last_done: h.last_done ?? null,
  }));

  const moodValues = (reflections ?? []).map((r: any) => Number(r.mood)).filter((v: number) => Number.isFinite(v));
  const mood_trend = moodValues.length ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length : 5;

  const days = new Map<string, any>();
  for (const l of healthLogs ?? []) {
    const day = l.occurred_on as string;
    const e = days.get(day) ?? { date: day };
    if (l.kind === "sleep" && l.payload?.hours != null) e.sleep = Number(l.payload.hours);
    if (l.kind === "water" && l.payload?.ml != null) e.water = (e.water ?? 0) + Number(l.payload.ml);
    if (l.kind === "metric" && l.payload?.weight_kg != null) e.weight = Number(l.payload.weight_kg);
    days.set(day, e);
  }

  const recent_memory = (recentMemory ?? []).slice(0, 20).map((m: any) => ({
    role: "system" as const,
    content: `[${m.memory_type ?? m.key ?? "fact"}] ${m.content ?? m.value ?? ""}`,
  }));

  return {
    user: {
      id: userData.id,
      name: userData.display_name,
      role: userData.member_key,
      age: userData.age ?? 0,
      ui_profile: userData.ui_profile ?? "default",
      xp: userData.xp ?? 0,
      level: userData.level ?? 1,
      member_key: userData.member_key,
    },
    habits_summary,
    goals_active: (goals ?? []).map((g: any) => ({
      title: g.title,
      type: g.horizon,
      progress: Number(g.progress ?? 0),
      target: Number(g.target ?? 100),
      deadline: g.due_at ?? null,
    })),
    health_last_7_days: Array.from(days.values()),
    mood_trend,
    top_patterns: topPatterns,
    recent_memory,
  };
}

// Ответ Claude в стиле Telegram-чата (короче, без формата 5 блоков для случайных вопросов)
export async function answerAsAssistant(userId: string, message: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const ctx = await buildUserContextById(userId);
  if (!ctx) throw new Error("user context unavailable");

  const sb = createAdminClient();
  // Последние 10 сообщений диалога (если есть)
  const { data: convData } = await sb
    .from("ai_conversations")
    .select("messages")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(
    (convData as any)?.messages,
  )
    ? (convData as any).messages
    : [];

  // Урезаем системный промт под Telegram: компактно, без обязательного 5-блочного формата
  const baseSystem = buildSystemPrompt(ctx);
  const tgSystem =
    baseSystem +
    "\n\nКОНТЕКСТ КАНАЛА: ты отвечаешь в Telegram-чате с ботом семьи. " +
    "Пиши обычным текстом без Markdown (без * _ ` ~ — они отобразятся как символы). " +
    "Будь компактен: 5-12 предложений. Используй эмодзи умеренно для расстановки акцентов. " +
    "Только для серьёзных вопросов о здоровье/привычках/целях используй формат " +
    "Факт→Механизм→Шаг→7/30/90. Для обычных бытовых вопросов — отвечай естественно. " +
    "НЕ добавляй HTML-комментарий AGENT_META — только сам текст.";

  const messages = [
    ...history.slice(-10).filter((m: any) => m.role === "user" || m.role === "assistant"),
    { role: "user" as const, content: message },
  ];

  const claude = new Anthropic({ apiKey });
  const resp = await claude.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1500,
    system: tgSystem,
    messages,
  });
  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .replace(/<!--AGENT_META[\s\S]*?-->/g, "")
    .trim();

  // Сохраняем в историю
  const updated = [...messages, { role: "assistant" as const, content: text }];
  const sliced = updated.slice(-50);
  const { data: existingConv } = await sb
    .from("ai_conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingConv) {
    await sb.from("ai_conversations").update({ messages: sliced, content: text, role: "assistant" }).eq("id", (existingConv as any).id);
  } else {
    await sb.from("ai_conversations").insert({
      user_id: userId,
      role: "assistant",
      content: text,
      messages: sliced,
    });
  }

  await sb.from("ai_memory").insert({
    user_id: userId,
    memory_type: "tg_chat",
    content: `Q: ${message.slice(0, 200)}\nA: ${text.slice(0, 500)}`,
    key: `tg_${Date.now()}`,
    value: text.slice(0, 500),
    importance: 3,
  });

  return text;
}

// Ответ с фото: Claude Vision принимает image по URL, отвечает с учётом
// контекста пользователя и подписи к фото. Сохраняем фото + AI-описание в
// память, чтобы FAM помнил содержимое.
export async function answerWithImage(
  userId: string,
  imageUrl: string,
  caption: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const ctx = await buildUserContextById(userId);
  if (!ctx) throw new Error("user context unavailable");

  const baseSystem = buildSystemPrompt(ctx);
  const tgSystem =
    baseSystem +
    "\n\nКОНТЕКСТ КАНАЛА: Telegram-чат с ботом, обычный текст без Markdown. " +
    "Сейчас пользователь прислал ФОТО. Сначала кратко (1-2 предложения) опиши что на фото, " +
    "потом дай практичный ответ/инсайт с привязкой к контексту: привычки, цели, рефлексии, питание, " +
    "тренировки, обстановка, эмоции — что подходит. Без преамбул, без воды.";

  const userText =
    caption.trim()
      ? `Фото с подписью: «${caption.trim()}».`
      : "Фото без подписи. Опиши что вижу и дай практический комментарий.";

  const claude = new Anthropic({ apiKey });
  const resp = await claude.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1200,
    system: tgSystem,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .replace(/<!--AGENT_META[\s\S]*?-->/g, "")
    .trim();

  const sb = createAdminClient();
  await sb.from("ai_memory").insert({
    user_id: userId,
    memory_type: "tg_photo",
    content: `[фото] ${caption ? `подпись: «${caption.slice(0, 200)}» — ` : ""}AI: ${text.slice(0, 500)}`,
    key: `tg_photo_${Date.now()}`,
    value: imageUrl,
    importance: 4,
  });

  return text;
}
