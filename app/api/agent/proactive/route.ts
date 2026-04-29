import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveProactiveMessage } from "@/lib/agent/memory";

export const runtime = "nodejs";
export const maxDuration = 300;

const HAIKU = "claude-haiku-4-5-20251001";

function authorized(req: NextRequest): boolean {
  const h = req.headers.get("authorization");
  return h === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runJob(req);
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runJob(req);
}

async function runJob(_req: NextRequest) {
  const sb = createAdminClient();
  const { data: users } = await sb.from("users").select("id, display_name, member_key, ui_profile, age");
  if (!users) return NextResponse.json({ processed: 0, messages_sent: 0 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claude = apiKey ? new Anthropic({ apiKey }) : null;

  let processed = 0;
  let sent = 0;

  await Promise.all(
    users.map(async (u: any) => {
      processed++;
      const userId = u.id as string;

      // подгружаем минимально необходимые данные
      const today = new Date();
      const todayISO = today.toISOString().slice(0, 10);
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

      const [
        { data: habits },
        { data: todayLogs },
        { data: lastLogs },
        { data: recentReflections },
        { data: monthlyGoals },
        { data: topPatterns },
      ] = await Promise.all([
        sb.from("habits").select("id, title, streak").eq("user_id", userId).eq("active", true),
        sb.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_on", todayISO),
        sb.from("habit_logs").select("done_on").eq("user_id", userId).gte("done_on", sevenDaysAgo).order("done_on", { ascending: false }).limit(5),
        sb.from("reflections").select("occurred_on, mood").eq("user_id", userId).gte("occurred_on", twoDaysAgo).order("occurred_on", { ascending: false }),
        sb.from("goals").select("title, progress, due_at, horizon").eq("user_id", userId).eq("status", "active").eq("horizon", "monthly"),
        sb.from("agent_patterns").select("*").eq("user_id", userId).gte("confidence", 0.8).order("confidence", { ascending: false }).limit(1),
      ]);

      const hour = today.getHours();
      const doneToday = new Set((todayLogs ?? []).map((l: any) => l.habit_id));

      // Триггер 1: streak_at_risk
      const at_risk = (habits ?? []).find(
        (h: any) => (h.streak ?? 0) >= 3 && !doneToday.has(h.id),
      );
      if (at_risk && hour >= 20) {
        const msg = await composeMessage(claude, u, "streak_at_risk", {
          habit: at_risk.title,
          streak: at_risk.streak,
        });
        if (await saveProactiveMessage(userId, "streak_at_risk", msg, 9, { habit: at_risk.title, streak: at_risk.streak })) sent++;
      }

      // Триггер 2: low_mood
      const moods = (recentReflections ?? []).map((r: any) => Number(r.mood)).filter((m: number) => Number.isFinite(m));
      const moodTrend = moods.length ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length : 5;
      if (moodTrend < 4 && moods.length >= 2 && moods.every((m: number) => m < 4)) {
        const msg = await composeMessage(claude, u, "low_mood", { trend: moodTrend });
        if (await saveProactiveMessage(userId, "low_mood", msg, 8, { trend: moodTrend })) sent++;
      }

      // Триггер 3: goal_at_risk
      const monthly = (monthlyGoals ?? [])[0];
      if (monthly) {
        const progress = Number(monthly.progress ?? 0);
        const due = monthly.due_at ? new Date(monthly.due_at) : null;
        const daysLeft = due ? Math.max(0, Math.round((due.getTime() - today.getTime()) / 86400000)) : 30;
        if (progress < 30 && daysLeft < 15 && daysLeft > 0) {
          const msg = await composeMessage(claude, u, "goal_at_risk", {
            goal: monthly.title,
            progress,
            days_left: daysLeft,
          });
          if (await saveProactiveMessage(userId, "goal_at_risk", msg, 7, { goal: monthly.title })) sent++;
        }
      }

      // Триггер 4: long_absence
      if ((lastLogs ?? []).length === 0) {
        const msg = await composeMessage(claude, u, "long_absence", {});
        if (await saveProactiveMessage(userId, "long_absence", msg, 5, {})) sent++;
      }

      // Триггер 5: pattern_reminder
      const top = (topPatterns ?? [])[0];
      if (top) {
        const msg = await composeMessage(claude, u, "pattern_reminder", {
          pattern_key: top.pattern_key,
          pattern_data: top.pattern_data,
          confidence: top.confidence,
        });
        if (await saveProactiveMessage(userId, "pattern_reminder", msg, 6, { pattern_key: top.pattern_key })) sent++;
      }
    }),
  );

  return NextResponse.json({ processed, messages_sent: sent });
}

async function composeMessage(
  claude: Anthropic | null,
  user: any,
  triggerType: string,
  payload: Record<string, unknown>,
): Promise<string> {
  // Fallback без LLM
  const fallback: Record<string, string> = {
    streak_at_risk: `${user.display_name}, твой стрик «${(payload as any).habit}» (${(payload as any).streak} дн) под угрозой. Закрой сегодня — биология вознаградит дофамином завтра утром.`,
    low_mood: `${user.display_name}, два дня подряд настроение ниже среднего. Кортизоловый фон растёт. 10 минут на солнце с утра + один тёплый разговор сегодня.`,
    goal_at_risk: `${user.display_name}, цель «${(payload as any).goal}» — ${(payload as any).progress}% за ${(payload as any).days_left} дней. Сократи до 1 шага в день.`,
    long_absence: `${user.display_name}, тебя давно не было. Один маленький шаг сегодня — и ритм вернётся.`,
    pattern_reminder: `${user.display_name}, заметил привычку «${(payload as any).pattern_key}». Используй её сегодня осознанно.`,
  };

  if (!claude) return fallback[triggerType] ?? `${user.display_name}, проверим план на сегодня?`;

  try {
    const ui = user.ui_profile ?? "default";
    const styleHint =
      ui === "elder"
        ? "Простой, тёплый, неторопливый, без англицизмов."
        : ui === "teen"
          ? "Энергичный, дружеский, упомяни XP."
          : "Прямой и конкретный.";

    const resp = await claude.messages.create({
      model: HAIKU,
      max_tokens: 220,
      messages: [
        {
          role: "user",
          content:
            `Сгенерируй проактивное сообщение пользователю в стиле "${styleHint}".\n` +
            `Триггер: ${triggerType}.\n` +
            `Данные: ${JSON.stringify(payload)}.\n` +
            `Имя: ${user.display_name}.\n` +
            `Требования: 2-3 предложения, коротко, по делу, с биологическим/нейронаучным акцентом если уместно. ` +
            `Один конкретный микро-шаг. Без markdown, без emoji.`,
        },
      ],
    });
    const text = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join(" ")
      .trim();
    return text || fallback[triggerType] || "";
  } catch {
    return fallback[triggerType] ?? "";
  }
}
