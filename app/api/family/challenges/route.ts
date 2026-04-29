import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { challenge_id, progress } = await req.json();

  const { data: challenge } = await sb
    .from("family_challenges")
    .select("*")
    .eq("id", challenge_id)
    .single();
  if (!challenge) return NextResponse.json({ error: "challenge not found" }, { status: 404 });

  const completed = Number(progress) >= 100;
  const { data, error } = await sb
    .from("challenge_progress")
    .upsert(
      {
        challenge_id,
        user_id: user.id,
        progress,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "challenge_id,user_id" } as any,
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: profile } = await sb.from("users").select("xp").eq("id", user.id).single();
  if (profile) {
    const xpDelta = completed ? challenge.reward_xp ?? 100 : XP_REWARDS.challenge_step;
    const newXp = profile.xp + xpDelta;
    await sb
      .from("users")
      .update({ xp: newXp, level: levelFromXp(newXp) })
      .eq("id", user.id);
  }

  await sb.from("family_events").insert({
    actor_id: user.id,
    kind: "challenge_progress",
    payload: { title: challenge.title, progress, completed },
  });

  return NextResponse.json(data);
}
