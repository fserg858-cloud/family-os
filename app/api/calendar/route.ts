import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyFamily } from "@/lib/agent/notify";

export const runtime = "nodejs";

export async function GET() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("family_calendar")
    .select("*")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, notes, location, starts_at, ends_at, for_members } = body;
  if (!title || !starts_at) {
    return NextResponse.json({ error: "title and starts_at required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("family_calendar")
    .insert({
      created_by: user.id,
      title,
      notes: notes || null,
      location: location || null,
      starts_at,
      ends_at: ends_at || null,
      for_members: for_members ?? [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: actor } = await sb.from("users").select("display_name").eq("id", user.id).maybeSingle();
  const dt = new Date(starts_at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  notifyFamily({
    exceptUserId: user.id,
    text: `📅 ${(actor as any)?.display_name ?? "Кто-то"} добавил событие: «${title}» — ${dt}${location ? ` 📍 ${location}` : ""}`,
  }).catch(() => {});

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
  await sb.from("family_calendar").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
