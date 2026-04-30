import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFamily } from "@/lib/agent/notify";

export const runtime = "nodejs";

// GET (CRON) — раз в час проверяем события, у которых через ~24ч и ~1ч начало,
// и шлём напоминания в TG (один раз для каждого окна).

function authorized(req: NextRequest): boolean {
  const h = req.headers.get("authorization");
  return h === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runJob();
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runJob();
}

async function runJob() {
  const sb = createAdminClient();
  const now = Date.now();
  const in23h = new Date(now + 23 * 3600 * 1000).toISOString();
  const in25h = new Date(now + 25 * 3600 * 1000).toISOString();
  const in30m = new Date(now + 30 * 60 * 1000).toISOString();
  const in90m = new Date(now + 90 * 60 * 1000).toISOString();

  let sent24 = 0;
  let sent1 = 0;

  // 24h окно
  const { data: e24 } = await sb
    .from("family_calendar")
    .select("*")
    .eq("reminder_24h_sent", false)
    .gte("starts_at", in23h)
    .lte("starts_at", in25h);
  for (const e of e24 ?? []) {
    const dt = new Date(e.starts_at).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    await notifyFamily({
      text: `📅 Завтра: «${e.title}» — ${dt}${e.location ? ` 📍 ${e.location}` : ""}${e.notes ? `\n${e.notes}` : ""}`,
    });
    await sb.from("family_calendar").update({ reminder_24h_sent: true }).eq("id", e.id);
    sent24++;
  }

  // 1h окно
  const { data: e1 } = await sb
    .from("family_calendar")
    .select("*")
    .eq("reminder_1h_sent", false)
    .gte("starts_at", in30m)
    .lte("starts_at", in90m);
  for (const e of e1 ?? []) {
    const dt = new Date(e.starts_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    await notifyFamily({
      text: `⏰ Через час: «${e.title}» — ${dt}${e.location ? ` 📍 ${e.location}` : ""}`,
    });
    await sb.from("family_calendar").update({ reminder_1h_sent: true }).eq("id", e.id);
    sent1++;
  }

  return NextResponse.json({ ok: true, sent_24h: sent24, sent_1h: sent1 });
}
