import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/db-status?secret=CRON_SECRET
// Diagnostic: проверяет что все таблицы из миграций 001+002+003 доступны.

const TABLES = [
  // 001
  "users", "goals", "habits", "habit_logs", "health_logs",
  "ai_memory", "ai_conversations", "reflections",
  "competencies", "learning_content", "achievements",
  "family_tasks", "family_events", "family_challenges",
  "challenge_progress", "shopping_list", "family_reports", "tatyana_stories",
  // 002
  "notifications",
  // 003
  "agent_patterns", "agent_decisions", "agent_proactive_messages",
  "agent_learning_log", "agent_context_cache", "family_intelligence_log",
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const results: Record<string, { ok: boolean; error?: string }> = {};

  await Promise.all(
    TABLES.map(async (t) => {
      const r = await sb.from(t).select("*", { count: "exact", head: true });
      results[t] = r.error ? { ok: false, error: r.error.message } : { ok: true };
    }),
  );

  const missing = Object.entries(results)
    .filter(([, v]) => !v.ok)
    .map(([k]) => k);

  return NextResponse.json({
    summary: {
      total: TABLES.length,
      ok: TABLES.length - missing.length,
      missing: missing.length,
      missing_tables: missing,
    },
    details: results,
  });
}
