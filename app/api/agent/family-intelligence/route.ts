import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const OPUS = "claude-opus-4-7";

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 500 });
  const claude = new Anthropic({ apiKey });

  const sb = createAdminClient();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const { data: members } = await sb.from("users").select("id, display_name, member_key, age, ui_profile");
  if (!members) return NextResponse.json({ ok: true });

  const family_data: Record<string, any> = { date: todayISO, members: {} };

  await Promise.all(
    members.map(async (m: any) => {
      const [
        { data: tasks },
        { data: habits },
        { data: habitLogs },
        { data: reflection },
        { data: health },
      ] = await Promise.all([
        sb.from("family_tasks").select("title, status, points, completed_at").or(`assigned_to.eq.${m.id},created_by.eq.${m.id}`).gte("created_at", dayStart),
        sb.from("habits").select("title, streak").eq("user_id", m.id).eq("active", true),
        sb.from("habit_logs").select("habit_id").eq("user_id", m.id).eq("done_on", todayISO),
        sb.from("reflections").select("mood, win, lesson").eq("user_id", m.id).eq("occurred_on", todayISO).maybeSingle(),
        sb.from("health_logs").select("kind, payload").eq("user_id", m.id).eq("occurred_on", todayISO),
      ]);
      family_data.members[m.display_name] = {
        member_key: m.member_key,
        age: m.age,
        tasks_today: (tasks ?? []).map((t: any) => ({
          title: t.title,
          status: t.status,
          points: t.points,
        })),
        habits_done: (habitLogs ?? []).length,
        habits_total: (habits ?? []).length,
        mood: reflection?.mood ?? null,
        win: reflection?.win ?? null,
        lesson: reflection?.lesson ?? null,
        health_logs: (health ?? []).map((h: any) => ({ kind: h.kind, payload: h.payload })),
      };
    }),
  );

  const isSunday = today.getDay() === 0;

  let insights: any = { insights: [], conflicts: [], suggestions: [], family_mood: 7 };
  try {
    const resp = await claude.messages.create({
      model: OPUS,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content:
            `Ты семейный аналитик. Данные семьи за день: ${JSON.stringify(family_data)}.\n` +
            `Верни ТОЛЬКО валидный JSON без markdown:\n` +
            `{"insights":[{"member":"...","insight":"...","type":"positive|warning|neutral"}],` +
            `"conflicts":[{"description":"...","members_involved":[],"resolution":"..."}],` +
            `"suggestions":[{"type":"activity|conversation|help","description":"...","for_members":[]}],` +
            `"family_mood":7}`,
        },
      ],
    });
    const text = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
    const m = text.match(/\{[\s\S]*\}/);
    if (m) insights = JSON.parse(m[0]);
  } catch {
    /* keep defaults */
  }

  let weeklyReport: any = null;
  if (isSunday) {
    try {
      const resp = await claude.messages.create({
        model: OPUS,
        max_tokens: 1800,
        messages: [
          {
            role: "user",
            content:
              `Сделай Family Weekly Report по данным: ${JSON.stringify(family_data)}.\n` +
              `Верни ТОЛЬКО JSON:\n` +
              `{"highlights":["..."],` +
              `"stats_per_member":[{"member":"...","tasks":0,"habits_pct":0,"mood":0}],` +
              `"family_achievement":"...",` +
              `"challenge_next_week":"...",` +
              `"motivational_note":"..."}`,
          },
        ],
      });
      const text = resp.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (m) weeklyReport = JSON.parse(m[0]);
    } catch {
      /* ignore */
    }
  }

  await sb.from("family_intelligence_log").upsert(
    {
      analysis_date: todayISO,
      participants_data: family_data,
      insights: insights.insights ?? [],
      conflicts: insights.conflicts ?? [],
      suggestions: insights.suggestions ?? [],
      weekly_report: weeklyReport,
    },
    { onConflict: "analysis_date" } as any,
  );

  if (weeklyReport) {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    const summary =
      `${weeklyReport.family_achievement ?? ""}\n\n` +
      (weeklyReport.highlights ?? []).map((h: string) => `• ${h}`).join("\n") +
      `\n\n${weeklyReport.motivational_note ?? ""}`;
    await sb.from("family_reports").upsert(
      { week_start: weekStart, summary, highlights: weeklyReport.highlights ?? [] },
      { onConflict: "week_start" } as any,
    );
  }

  return NextResponse.json({ ok: true });
}
