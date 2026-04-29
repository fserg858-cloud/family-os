import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markDecisionOutcome } from "@/lib/agent/memory";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: patterns }, { data: decisions }, { data: insights }] = await Promise.all([
    sb.from("agent_patterns").select("*").eq("user_id", user.id).order("confidence", { ascending: false }),
    sb.from("agent_decisions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    sb.from("ai_memory").select("id, memory_type, content, value, key, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  return NextResponse.json({
    patterns: patterns ?? [],
    decisions: decisions ?? [],
    insights: insights ?? [],
  });
}

export async function DELETE(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { type, id, all } = body;

  if (all) {
    await Promise.all([
      sb.from("agent_patterns").delete().eq("user_id", user.id),
      sb.from("agent_decisions").delete().eq("user_id", user.id),
      sb.from("ai_memory").delete().eq("user_id", user.id),
    ]);
    return NextResponse.json({ ok: true, cleared: "all" });
  }

  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  if (type === "pattern") {
    await sb.from("agent_patterns").delete().eq("id", id).eq("user_id", user.id);
  } else if (type === "decision") {
    await sb.from("agent_decisions").delete().eq("id", id).eq("user_id", user.id);
  } else if (type === "memory") {
    await sb.from("ai_memory").delete().eq("id", id).eq("user_id", user.id);
  } else {
    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decision_id, outcome } = await req.json();
  if (!decision_id || !["positive", "negative"].includes(outcome)) {
    return NextResponse.json({ error: "decision_id and outcome required" }, { status: 400 });
  }
  await markDecisionOutcome(decision_id, outcome);
  return NextResponse.json({ ok: true });
}
