import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS, levelFromXp } from "@/lib/xp";
import { recordEvent } from "@/lib/agent/learn";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "title",
  "description",
  "notes",
  "assigned_to",
  "assignees",
  "reward_xp",
  "due_at",
  "category",
  "recurrence",
  "priority",
  "points",
]);

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
  const body = await req.json();

  const insert: any = { created_by: user.id };
  for (const k of Object.keys(body)) {
    if (ALLOWED.has(k)) insert[k] = body[k];
  }
  if (!insert.points && body.reward_xp) insert.points = body.reward_xp;
  if (!insert.reward_xp && insert.points) insert.reward_xp = insert.points;
  insert.reward_xp ??= XP_REWARDS.task_complete;
  insert.points ??= XP_REWARDS.task_complete;

  const { data, error } = await sb.from("family_tasks").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sb.from("family_events").insert({
    actor_id: user.id,
    kind: "task_created",
    payload: { title: data.title, category: data.category },
  });

  // Уведомление исполнителю
  if (data.assigned_to && data.assigned_to !== user.id) {
    await sb.from("notifications").insert({
      user_id: data.assigned_to,
      actor_id: user.id,
      kind: "task_assigned",
      title: "Новая задача",
      body: data.title,
      payload: { task_id: data.id },
    });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, status, ...rest } = await req.json();
  const { data: task } = await sb.from("family_tasks").select("*").eq("id", id).single();
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const update: any = { ...rest };
  if (status) update.status = status;
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
      const reward = task.points ?? task.reward_xp ?? XP_REWARDS.task_complete;
      const newXp = profile.xp + reward;
      await sb
        .from("users")
        .update({ xp: newXp, level: levelFromXp(newXp) })
        .eq("id", recipient);
    }
    await sb.from("family_events").insert({
      actor_id: user.id,
      kind: "task_completed",
      payload: { title: task.title, xp: task.points ?? task.reward_xp ?? 10 },
    });

    recordEvent(user.id, "task_completed", {
      task_title: task.title,
      category: task.category,
      priority: task.priority,
      points: task.points ?? task.reward_xp,
      time_of_day: new Date().getHours(),
    });

    // Уведомить создателя, если это не он сам
    if (task.created_by && task.created_by !== user.id) {
      await sb.from("notifications").insert({
        user_id: task.created_by,
        actor_id: user.id,
        kind: "task_completed",
        title: "Задача выполнена",
        body: task.title,
        payload: { task_id: id },
      });
    }
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
