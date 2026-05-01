import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("family_messages")
    .select("id, sender_id, body, attachment_url, attachment_type, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { body, attachment_url, attachment_type } = await req.json();
  const text = typeof body === "string" ? body.trim().slice(0, 4000) : "";
  const url = typeof attachment_url === "string" ? attachment_url : null;
  const type = typeof attachment_type === "string" ? attachment_type : null;
  if (!text && !url) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("family_messages")
    .insert({
      sender_id: user.id,
      body: text || null,
      attachment_url: url,
      attachment_type: type,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: data });
}

export async function DELETE(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await sb
    .from("family_messages")
    .delete()
    .eq("id", id)
    .eq("sender_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
