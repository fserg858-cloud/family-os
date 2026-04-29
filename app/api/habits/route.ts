import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";
import { recordEvent } from "@/lib/agent/learn";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("habits").select("*").eq("active", true).order("created_at");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { kind } = body;

  if (kind === "create") {
    const { title, why } = body;
    const { data, error } = await sb
      .from("habits")
      .insert({ user_id: user.id, title, why: why || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (kind === "log") {
    const { habit_id } = body;
    const today = todayISO();

    const { data: habit } = await sb.from("habits").select("*").eq("id", habit_id).single();
    if (!habit) return NextResponse.json({ error: "habit not found" }, { status: 404 });

    const { error: logErr } = await sb.from("habit_logs").upsert(
      { user_id: user.id, habit_id, done_on: today },
      { onConflict: "habit_id,done_on" } as any,
    );
    if (logErr) return NextResponse.json({ error: logErr.message }, { status: 400 });

    const newStreak = (habit.streak ?? 0) + 1;
    const newBest = Math.max(habit.best_streak ?? 0, newStreak);
    await sb.from("habits").update({ streak: newStreak, best_streak: newBest }).eq("id", habit_id);

    const { data: profile } = await sb.from("users").select("xp, streak_days").eq("id", user.id).single();
    if (profile) {
      const newXp = profile.xp + (habit.xp_per_log ?? XP_REWARDS.habit_log);
      await sb
        .from("users")
        .update({ xp: newXp, level: levelFromXp(newXp) })
        .eq("id", user.id);
    }

    await sb.from("family_events").insert({
      actor_id: user.id,
      kind: "habit_logged",
      payload: { title: habit.title, streak: newStreak },
    });

    // обучение агента (fire-and-forget)
    recordEvent(user.id, "habit_done", {
      habit_id,
      habit_title: habit.title,
      streak: newStreak,
      time_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
    });

    return NextResponse.json({ ok: true, streak: newStreak });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await sb.from("habits").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
