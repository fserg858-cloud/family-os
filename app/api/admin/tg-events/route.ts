import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/tg-events?secret=CRON_SECRET
// Показывает 30 последних family_events kind='tg_login' для отладки.

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("family_events")
    .select("id, kind, payload, created_at")
    .eq("kind", "tg_login")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, events: data ?? [] });
}
