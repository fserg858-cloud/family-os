import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, id } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  if (action === "read") {
    await sb
      .from("agent_proactive_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  } else if (action === "dismiss") {
    await sb
      .from("agent_proactive_messages")
      .update({ dismissed: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  } else if (action === "act") {
    await sb
      .from("agent_proactive_messages")
      .update({ acted_upon: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
