import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTopPatterns, updateContextCache } from "@/lib/agent/memory";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const { data: users } = await sb.from("users").select("id");
  if (!users) return NextResponse.json({ updated: 0 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  let updated = 0;
  await Promise.all(
    users.map(async (u: any) => {
      const userId = u.id;
      const [
        { data: habits },
        { data: habitLogs },
        { data: goals },
        { data: healthLogs },
        { data: reflections },
        topPatterns,
      ] = await Promise.all([
        sb.from("habits").select("*").eq("user_id", userId).eq("active", true),
        sb.from("habit_logs").select("habit_id, done_on").eq("user_id", userId).gte("done_on", sevenDaysAgo),
        sb.from("goals").select("title, horizon, progress, target, due_at").eq("user_id", userId).eq("status", "active"),
        sb.from("health_logs").select("kind, payload, occurred_on").eq("user_id", userId).gte("occurred_on", sevenDaysAgo),
        sb.from("reflections").select("occurred_on, mood").eq("user_id", userId).gte("occurred_on", sevenDaysAgo),
        getTopPatterns(userId, 10),
      ]);

      const habits_summary = (habits ?? []).map((h: any) => {
        const logsForH = (habitLogs ?? []).filter((l: any) => l.habit_id === h.id);
        const lastLog = logsForH.sort((a: any, b: any) => (a.done_on < b.done_on ? 1 : -1))[0];
        return {
          habit: h.title,
          done_count: logsForH.length,
          streak: h.streak ?? 0,
          last_done: lastLog?.done_on ?? h.last_done ?? null,
        };
      });

      const goals_summary = (goals ?? []).map((g: any) => ({
        title: g.title,
        type: g.horizon,
        progress: Number(g.progress ?? 0),
        target: Number(g.target ?? 100),
        deadline: g.due_at ?? null,
      }));

      const moodValues = (reflections ?? [])
        .map((r: any) => Number(r.mood))
        .filter((v: number) => Number.isFinite(v));
      const mood_trend = moodValues.length
        ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length
        : 5;

      const days = new Map<string, any>();
      for (const l of healthLogs ?? []) {
        const day = l.occurred_on as string;
        const e = days.get(day) ?? { date: day };
        if (l.kind === "sleep" && l.payload?.hours != null) e.sleep = Number(l.payload.hours);
        if (l.kind === "water" && l.payload?.ml != null) e.water = (e.water ?? 0) + Number(l.payload.ml);
        if (l.kind === "metric" && l.payload?.weight_kg != null) e.weight = Number(l.payload.weight_kg);
        if (l.kind === "workout" && l.payload?.intensity != null) e.energy = Number(l.payload.intensity);
        days.set(day, e);
      }
      for (const r of reflections ?? []) {
        const day = r.occurred_on as string;
        const e = days.get(day) ?? { date: day };
        if (r.mood != null) e.mood = Number(r.mood);
        days.set(day, e);
      }

      await updateContextCache(userId, {
        habits_summary,
        goals_summary,
        health_trends: { days: Array.from(days.values()) },
        mood_trend,
        top_patterns: topPatterns,
      });
      updated++;
    }),
  );

  return NextResponse.json({ updated });
}
