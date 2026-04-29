import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, buildSystemPrompt } from "@/lib/claude";
import type { MemberKey } from "@/lib/members";
import { todayISO } from "@/lib/utils";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";
import { recordEvent } from "@/lib/agent/learn";

export const runtime = "nodejs";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { win, lesson, next_step, mood } = await req.json();

  const { data: profile } = await sb.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "profile missing" }, { status: 400 });

  const today = todayISO();

  const anthropic = getAnthropic();
  const system = buildSystemPrompt(profile.member_key as MemberKey);

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 700,
    system,
    messages: [
      {
        role: "user",
        content:
          `Вечерняя рефлексия ${today}.\n` +
          `Победа: ${win || "(пусто)"}\nУрок: ${lesson || "(пусто)"}\nШаг на завтра: ${next_step || "(пусто)"}\nНастроение: ${mood ?? 3}/5\n\n` +
          `Дай мне инсайт по стандартному формату (Факт → Механизм → Что значит → Шаг → 7/30/90).`,
      },
    ],
  });

  const ai_insight = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const { data: existing } = await sb
    .from("reflections")
    .select("id")
    .eq("user_id", user.id)
    .eq("occurred_on", today)
    .maybeSingle();

  let newXp = profile.xp;
  if (!existing) {
    newXp = profile.xp + XP_REWARDS.reflection;
    await sb
      .from("users")
      .update({ xp: newXp, level: levelFromXp(newXp) })
      .eq("id", user.id);

    await sb.from("family_events").insert({
      actor_id: user.id,
      kind: "reflection_saved",
      payload: { mood },
    });
  }

  await sb.from("reflections").upsert(
    {
      user_id: user.id,
      occurred_on: today,
      win,
      lesson,
      next_step,
      ai_insight,
      mood,
    },
    { onConflict: "user_id,occurred_on" } as any,
  );

  recordEvent(user.id, "reflection_submitted", {
    win,
    lesson,
    next_step,
    mood,
    date: today,
  });

  return NextResponse.json({ ai_insight, xp: newXp });
}
