import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordEvent } from "@/lib/agent/learn";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb
    .from("health_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { kind, occurred_on, payload } = await req.json();
  const { data, error } = await sb
    .from("health_logs")
    .insert({ user_id: user.id, kind, occurred_on, payload })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  recordEvent(user.id, "health_logged", {
    type: kind,
    value: payload,
    date: occurred_on,
  });

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
  await sb.from("health_logs").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
