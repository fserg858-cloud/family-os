import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const kind = body.kind;

  if (kind === "competency") {
    const { data, error } = await sb
      .from("competencies")
      .insert({ user_id: user.id, name: body.name, category: body.category || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (kind === "content") {
    const { data, error } = await sb
      .from("learning_content")
      .insert({
        user_id: user.id,
        title: body.title,
        source: body.source || null,
        url: body.url || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, status, progress } = await req.json();
  if (status) {
    await sb.from("learning_content").update({ status }).eq("id", id).eq("user_id", user.id);
  }
  if (progress != null) {
    await sb.from("competencies").update({ progress }).eq("id", id).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true });
}
