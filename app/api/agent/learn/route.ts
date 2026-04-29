import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { upsertPattern } from "@/lib/agent/memory";

export const runtime = "nodejs";

const HAIKU = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_type, event_data } = await req.json();
  if (!event_type) return NextResponse.json({ error: "event_type required" }, { status: 400 });

  // Запись события
  await supabase.from("agent_learning_log").insert({
    user_id: user.id,
    event_type,
    event_data: event_data ?? {},
  });

  // Последние 20 событий этого типа
  const { data: recentEvents } = await supabase
    .from("agent_learning_log")
    .select("event_type, event_data, created_at")
    .eq("user_id", user.id)
    .eq("event_type", event_type)
    .order("created_at", { ascending: false })
    .limit(20);

  let saved = 0;

  // Эвристика 1: 3 пропуска подряд для одной привычки -> streak_risk
  if (event_type === "habit_missed") {
    const habitId = event_data?.habit_id;
    if (habitId) {
      const last3 = (recentEvents ?? [])
        .filter((e: any) => e.event_data?.habit_id === habitId)
        .slice(0, 3);
      if (last3.length === 3 && last3.every((e: any) => e.event_type === "habit_missed")) {
        await upsertPattern(
          user.id,
          `streak_risk_${event_data.habit_title ?? habitId}`,
          "trigger",
          { habit_id: habitId, habit_title: event_data.habit_title ?? "" },
          0.15,
        );
        saved++;
      }
    }
  }

  // Эвристика 2: два дня подряд mood < 4
  if (event_type === "mood_logged" || event_type === "reflection_submitted") {
    const moods = (recentEvents ?? [])
      .map((e: any) => Number(e.event_data?.mood ?? e.event_data?.value))
      .filter((v: number) => Number.isFinite(v))
      .slice(0, 2);
    if (moods.length === 2 && moods.every((m) => m < 4)) {
      await upsertPattern(
        user.id,
        "low_mood_consecutive",
        "trigger",
        { last_two: moods },
        0.15,
      );
      saved++;
    }
  }

  // ML-обучение через Haiku — только если накоплено хотя бы 5 событий
  if ((recentEvents ?? []).length >= 5 && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const eventsTrimmed = (recentEvents ?? []).slice(0, 20).map((e: any) => ({
        type: e.event_type,
        data: e.event_data,
        at: e.created_at,
      }));
      const resp = await client.messages.create({
        model: HAIKU,
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content:
              `Проанализируй события пользователя и найди паттерны поведения. ` +
              `События (JSON): ${JSON.stringify(eventsTrimmed)}.\n` +
              `Верни ТОЛЬКО JSON без пояснений и markdown-код-блоков:\n` +
              `{"patterns":[{"key":"...","type":"behavior","data":{},"confidence":0.6}]}`,
          },
        ],
      });
      const raw = resp.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      // вынимаем JSON из ответа
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (Array.isArray(parsed.patterns)) {
          for (const p of parsed.patterns) {
            if (typeof p?.key === "string" && Number(p.confidence) >= 0.6) {
              await upsertPattern(
                user.id,
                p.key,
                p.type ?? "behavior",
                p.data ?? {},
                0.05,
              );
              saved++;
            }
          }
        }
      }
    } catch {
      /* haiku errors не блокируют ответ */
    }
  }

  return NextResponse.json({ ok: true, patterns_saved: saved });
}
