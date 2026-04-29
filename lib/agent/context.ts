import { createClient } from "@/lib/supabase/server";
import { getContextCache, getTopPatterns, updateContextCache } from "./memory";
import type { UserContext } from "./types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function buildUserContext(userId: string): Promise<UserContext> {
  const cached = await getContextCache(userId);

  const supabase = createClient();
  const { data: userData } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();

  // Если кэш свежий — используем его, но user всегда читаем свежий
  if (cached && cached.habits_summary && cached.goals_summary) {
    return {
      user: {
        id: userData?.id ?? userId,
        name: userData?.display_name ?? "Участник",
        role: userData?.member_key ?? "",
        age: userData?.age ?? 0,
        ui_profile: userData?.ui_profile ?? "default",
        xp: userData?.xp ?? 0,
        level: userData?.level ?? 1,
        member_key: userData?.member_key ?? "",
      },
      habits_summary: cached.habits_summary,
      goals_active: cached.goals_summary,
      health_last_7_days: cached.health_trends?.days ?? [],
      mood_trend: Number(cached.mood_trend ?? 5),
      top_patterns: cached.top_patterns ?? [],
      recent_memory: cached.health_trends?.recent_memory ?? [],
    };
  }

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    { data: habits },
    { data: habitLogs },
    { data: goals },
    { data: healthLogs },
    { data: reflections },
    { data: recentMemory },
    topPatterns,
  ] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", userId).eq("active", true),
    supabase.from("habit_logs").select("habit_id, done_on").eq("user_id", userId).gte("done_on", sevenDaysAgoISO),
    supabase.from("goals").select("*").eq("user_id", userId).eq("status", "active"),
    supabase.from("health_logs").select("*").eq("user_id", userId).gte("occurred_on", sevenDaysAgoISO).order("occurred_on", { ascending: false }),
    supabase.from("reflections").select("occurred_on, mood").eq("user_id", userId).gte("occurred_on", sevenDaysAgoISO).order("occurred_on", { ascending: false }),
    supabase.from("ai_memory").select("memory_type, content, value, key, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    getTopPatterns(userId, 10),
  ]);

  const habits_summary = (habits ?? []).map((h: any) => {
    const logsForH = (habitLogs ?? []).filter((l: any) => l.habit_id === h.id);
    const lastLog = logsForH.sort((a: any, b: any) => (a.done_on < b.done_on ? 1 : -1))[0];
    return {
      habit: h.title,
      done_count: logsForH.length,
      streak: h.streak ?? 0,
      last_done: lastLog?.done_on ?? h.last_done ?? null,
    };
  });

  const moodValues = (reflections ?? [])
    .map((r: any) => Number(r.mood))
    .filter((v: number) => Number.isFinite(v));
  const mood_trend = moodValues.length > 0
    ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length
    : 5;

  const healthByDay = new Map<string, any>();
  for (const l of healthLogs ?? []) {
    const day = l.occurred_on as string;
    const entry = healthByDay.get(day) ?? { date: day };
    if (l.kind === "sleep" && l.payload?.hours != null) entry.sleep = Number(l.payload.hours);
    if (l.kind === "water" && l.payload?.ml != null) entry.water = (entry.water ?? 0) + Number(l.payload.ml);
    if (l.kind === "metric" && l.payload?.weight_kg != null) entry.weight = Number(l.payload.weight_kg);
    if (l.kind === "workout" && l.payload?.intensity != null) entry.energy = Number(l.payload.intensity);
    healthByDay.set(day, entry);
  }
  for (const r of reflections ?? []) {
    const day = r.occurred_on as string;
    const entry = healthByDay.get(day) ?? { date: day };
    if (r.mood != null) entry.mood = Number(r.mood);
    healthByDay.set(day, entry);
  }
  const health_last_7_days = Array.from(healthByDay.values()).sort((a, b) => (a.date < b.date ? 1 : -1));

  const recent_memory = (recentMemory ?? []).slice(0, 20).map((m: any) => ({
    role: "system" as const,
    content: `[${m.memory_type ?? m.key ?? "fact"}] ${m.content ?? m.value ?? ""}`,
  }));

  const ctx: UserContext = {
    user: {
      id: userData?.id ?? userId,
      name: userData?.display_name ?? "Участник",
      role: userData?.member_key ?? "",
      age: userData?.age ?? 0,
      ui_profile: userData?.ui_profile ?? "default",
      xp: userData?.xp ?? 0,
      level: userData?.level ?? 1,
      member_key: userData?.member_key ?? "",
    },
    habits_summary,
    goals_active: (goals ?? []).map((g: any) => ({
      title: g.title,
      type: g.horizon,
      progress: Number(g.progress ?? 0),
      target: Number(g.target ?? 100),
      deadline: g.due_at ?? null,
    })),
    health_last_7_days,
    mood_trend,
    top_patterns: topPatterns,
    recent_memory,
  };

  // Обновляем кэш в фоне
  updateContextCache(userId, {
    habits_summary,
    goals_summary: ctx.goals_active,
    health_trends: { days: health_last_7_days, recent_memory },
    mood_trend,
    top_patterns: topPatterns,
  }).catch(() => {});

  return ctx;
}

const UI_INSTRUCTIONS: Record<string, string> = {
  elder: "Говори очень просто, короткими предложениями. Избегай технических терминов и англицизмов. Тёплый, заботливый тон, без давления.",
  teen: "Говори энергично, по-дружески. Упоминай XP и достижения. Геймифицируй советы, давай быстрые победы.",
  default: "Говори прямо и конкретно. Факты и шаги. Без воды, без банальностей.",
};

export function buildSystemPrompt(ctx: UserContext): string {
  const ui = UI_INSTRUCTIONS[ctx.user.ui_profile] ?? UI_INSTRUCTIONS.default;

  const patterns_text = ctx.top_patterns.length
    ? ctx.top_patterns
        .map((p) => `- ${p.pattern_key} (уверенность ${Math.round(p.confidence * 100)}%): ${JSON.stringify(p.pattern_data)}`)
        .join("\n")
    : "Паттерны накапливаются — продолжай пользоваться приложением";

  const habits_text = ctx.habits_summary.length
    ? ctx.habits_summary.map((h) => `- "${h.habit}": выполнено ${h.done_count}/7 дней, стрик ${h.streak} дн`).join("\n")
    : "Привычки не добавлены";

  const goals_text = ctx.goals_active.length
    ? ctx.goals_active.map((g) => `- "${g.title}" (${g.type}): ${Math.round(Number(g.progress))}/${Math.round(Number(g.target))}`).join("\n")
    : "Нет активных целей";

  const memory_text = ctx.recent_memory.length
    ? ctx.recent_memory.map((m) => m.content).join("\n")
    : "История пуста";

  const health_text = ctx.health_last_7_days.length
    ? ctx.health_last_7_days
        .slice(0, 7)
        .map((d) => {
          const parts: string[] = [];
          if (d.mood != null) parts.push(`mood ${d.mood}`);
          if (d.sleep != null) parts.push(`сон ${d.sleep}ч`);
          if (d.water != null) parts.push(`вода ${d.water}мл`);
          if (d.weight != null) parts.push(`вес ${d.weight}кг`);
          if (d.energy != null) parts.push(`интенс ${d.energy}/5`);
          return `- ${d.date}: ${parts.join(", ") || "—"}`;
        })
        .join("\n")
    : "Нет данных";

  return `Ты — персональный AI-агент ${ctx.user.name} (${ctx.user.role || "участник"}, ${ctx.user.age} лет) в семейном приложении XS.Family.

КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
Уровень: ${ctx.user.level} | XP: ${ctx.user.xp}
Настроение за неделю (среднее): ${ctx.mood_trend.toFixed(1)}/5

ПАТТЕРНЫ ПОВЕДЕНИЯ (выявлены из истории):
${patterns_text}

ПРИВЫЧКИ (последние 7 дней):
${habits_text}

АКТИВНЫЕ ЦЕЛИ:
${goals_text}

ЗДОРОВЬЕ (7 дней):
${health_text}

ИСТОРИЯ ПАМЯТИ (последние записи):
${memory_text}

СТИЛЬ ОБЩЕНИЯ: ${ui}

ПРИНЦИПЫ РАБОТЫ:
1. Ты помнишь всё что знаешь о ${ctx.user.name}. Используй контекст выше в каждом ответе.
2. Для вопросов о здоровье, привычках, развитии — отвечай строго по формату:
   → Факт (что происходит)
   → Механизм (биология/нейронаука — ПОЧЕМУ именно так)
   → Что это значит конкретно для ${ctx.user.name}
   → Следующий шаг (один конкретный)
   → Результат через 7 / 30 / 90 дней
3. Замечаешь риски (стрик под угрозой, стресс, невыполненная цель) — говоришь об этом сам.
4. Для повторяющихся вопросов — применяешь то что уже работало, не объясняешь заново.
5. Говоришь как умный друг, не как бот. Коротко когда нужно коротко.

После каждого ответа добавляй в HTML-комментарий (невидимый пользователю):
<!--AGENT_META
{"patterns":[{"key":"...","type":"behavior","data":{},"confidence":0.6}],"actions":[]}
-->`;
}
