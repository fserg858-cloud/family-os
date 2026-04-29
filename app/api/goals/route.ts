import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";
import { recordEvent } from "@/lib/agent/learn";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("goals").select("*").eq("user_id", user.id);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, description, horizon } = await req.json();
  const { data, error } = await sb
    .from("goals")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      horizon: horizon || "weekly",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, progress, status } = await req.json();
  const wasDoneBefore = await sb
    .from("goals")
    .select("status, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { data, error } = await sb
    .from("goals")
    .update({ progress, status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (status === "done" && wasDoneBefore.data?.status !== "done") {
    const { data: profile } = await sb.from("users").select("xp").eq("id", user.id).single();
    if (profile) {
      const newXp = profile.xp + XP_REWARDS.goal_complete;
      await sb
        .from("users")
        .update({ xp: newXp, level: levelFromXp(newXp) })
        .eq("id", user.id);
    }
    await sb.from("family_events").insert({
      actor_id: user.id,
      kind: "goal_completed",
      payload: { title: wasDoneBefore.data?.title },
    });

    recordEvent(user.id, "goal_completed", {
      goal_title: wasDoneBefore.data?.title,
      type: data.horizon,
      progress: Number(progress),
      target: Number(data.target ?? 100),
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await sb.from("goals").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
