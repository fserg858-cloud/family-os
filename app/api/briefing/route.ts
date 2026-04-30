import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, CLAUDE_MODEL, buildSystemPrompt } from "@/lib/claude";
import type { MemberKey } from "@/lib/members";
import { todayISO } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind ?? "morning";

  const { data: profile } = await sb.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "profile missing" }, { status: 400 });

  const anthropic = getAnthropic();

  if (kind === "weekly_report") {
    const weekStart = body.week_start ?? todayISO();
    const since = new Date(weekStart).toISOString();
    const { data: events } = await sb
      .from("family_events")
      .select("kind, payload, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    const summary = (events ?? [])
      .map((e: any) => `- ${e.kind} :: ${JSON.stringify(e.payload)}`)
      .join("\n");

    const system = buildSystemPrompt(profile.member_key as MemberKey);
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system,
      messages: [
        {
          role: "user",
          content: `Собери Family Report недели для ${profile.display_name}. Сырые события за неделю:\n${summary || "(нет данных)"}\n\nФормат:\n1) WHAT THE DATA SHOWS — 2-3 факта (без обобщений)\n2) ONE INSIGHT — главный паттерн недели, чем он опасен/полезен\n3) [ACTION] — одно конкретное действие на следующую неделю\n\nЕсли данных мало — скажи прямо что не хватает, не выдумывай.`,
        },
      ],
    });

    const text = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    await sb.from("family_reports").upsert(
      { week_start: weekStart, summary: text, highlights: [] },
      { onConflict: "week_start" },
    );

    return NextResponse.json({ summary: text, highlights: [] });
  }

  // morning briefing
  const today = todayISO();
  const [{ data: habits }, { data: logs }, { data: goals }, { data: tasks }] = await Promise.all([
    sb.from("habits").select("title").eq("active", true),
    sb.from("habit_logs").select("habit_id").eq("done_on", today),
    sb.from("goals").select("title, progress, horizon").eq("status", "active").limit(5),
    sb.from("family_tasks").select("title").eq("assigned_to", user.id).neq("status", "done").limit(3),
  ]);

  const ctx =
    `Привычки активные: ${habits?.length ?? 0}, отмечено сегодня: ${logs?.length ?? 0}\n` +
    `Активные цели: ${(goals ?? []).map((g: any) => `${g.title} (${g.horizon}, ${Math.round(Number(g.progress))}%)`).join("; ") || "нет"}\n` +
    `Задачи: ${(tasks ?? []).map((t: any) => t.title).join("; ") || "нет"}`;

  const system = buildSystemPrompt(profile.member_key as MemberKey);
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 900,
    system,
    messages: [
      {
        role: "user",
        content: `Утро ${today}. Дай брифинг по three-block framework (MORNING / WORK / RECOVERY) и 3 приоритета на сегодня.\nКонтекст:\n${ctx}\n\nФормат:\n- 1 предложение: что показывают данные сейчас\n- 3 приоритета: каждый привязан к конкретному блоку дня\n- [ACTION] — что сделать в ближайшие 30 минут чтобы начать день правильно`,
      },
    ],
  });

  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return NextResponse.json({ briefing: text });
}
