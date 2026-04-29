import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("family_tasks").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, description, assigned_to, reward_xp, due_at } = await req.json();
  const { data, error } = await sb
    .from("family_tasks")
    .insert({
      title,
      description: description || null,
      assigned_to: assigned_to || null,
      reward_xp: reward_xp ?? XP_REWARDS.task_complete,
      due_at: due_at || null,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sb.from("family_events").insert({
    actor_id: user.id,
    kind: "task_created",
    payload: { title: data.title },
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  const { data: task } = await sb.from("family_tasks").select("*").eq("id", id).single();
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const update: any = { status };
  if (status === "done") update.completed_at = new Date().toISOString();

  const { data, error } = await sb
    .from("family_tasks")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (status === "done" && task.status !== "done") {
    const recipient = task.assigned_to ?? user.id;
    const { data: profile } = await sb.from("users").select("xp").eq("id", recipient).single();
    if (profile) {
      const newXp = profile.xp + (task.reward_xp ?? XP_REWARDS.task_complete);
      await sb
        .from("users")
        .update({ xp: newXp, level: levelFromXp(newXp) })
        .eq("id", recipient);
    }
    await sb.from("family_events").insert({
      actor_id: user.id,
      kind: "task_completed",
      payload: { title: task.title, xp: task.reward_xp },
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
  await sb.from("family_tasks").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
