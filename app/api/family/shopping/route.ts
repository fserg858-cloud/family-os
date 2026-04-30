import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyFamily } from "@/lib/agent/notify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { item, qty, category } = await req.json();
  const { data, error } = await sb
    .from("shopping_list")
    .insert({ added_by: user.id, item, qty: qty || null, category: category ?? "other" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sb.from("family_events").insert({
    actor_id: user.id,
    kind: "shopping_added",
    payload: { item },
  });

  const { data: actor } = await sb.from("users").select("display_name").eq("id", user.id).maybeSingle();
  notifyFamily({
    exceptUserId: user.id,
    text: `🛒 ${(actor as any)?.display_name ?? "Кто-то"} добавил в список: ${data.item}${qty ? ` (${qty})` : ""}`,
  }).catch(() => {});

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, bought } = await req.json();
  await sb.from("shopping_list").update({ bought }).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await sb.from("shopping_list").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
