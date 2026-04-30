import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

// GET /api/admin/test-suite?secret=...&user_id=<uuid>
// Прогон всех функций приложения от имени указанного user'а через service_role.
// Возвращает отчёт по каждому шагу с временем и ошибками.

interface Step {
  name: string;
  ok: boolean;
  ms: number;
  detail?: any;
  error?: string;
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<{ step: Step; result: T | null }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return {
      step: { name, ok: true, ms: Date.now() - t0, detail: summarize(result) },
      result,
    };
  } catch (e: any) {
    return {
      step: { name, ok: false, ms: Date.now() - t0, error: e?.message ?? String(e) },
      result: null,
    };
  }
}

function summarize(v: any): any {
  if (v == null) return null;
  if (typeof v === "string") return v.length > 200 ? v.slice(0, 200) + "…" : v;
  if (Array.isArray(v)) return { length: v.length, sample: v[0] ? summarize(v[0]) : null };
  if (typeof v === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v).slice(0, 10)) {
      out[k] = typeof v[k] === "string" && v[k].length > 100 ? v[k].slice(0, 100) + "…" : v[k];
    }
    return out;
  }
  return v;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();
  const steps: Step[] = [];

  // 1) Найти test-юзера: либо переданный user_id, либо первого из public.users
  const userIdParam = url.searchParams.get("user_id");
  let userId: string | null = userIdParam;
  if (!userId) {
    const { data: users } = await sb.from("users").select("id, display_name, member_key").limit(1);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "no users in public.users" }, { status: 400 });
    }
    userId = users[0].id;
  }
  steps.push({ name: "pick test user", ok: !!userId, ms: 0, detail: { userId } });

  // 2) GOALS — create, update progress to done
  let goalId: string | null = null;
  {
    const r = await step("goals.insert", () =>
      sb
        .from("goals")
        .insert({
          user_id: userId,
          title: `[test] Прочитать книгу ${Date.now()}`,
          horizon: "weekly",
          target: 100,
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
    goalId = (r.result as any)?.id ?? null;
  }
  if (goalId) {
    const r = await step("goals.update progress=100", () =>
      sb
        .from("goals")
        .update({ progress: 100, status: "done" })
        .eq("id", goalId!)
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 3) HABITS — create, log
  let habitId: string | null = null;
  {
    const r = await step("habits.insert", () =>
      sb
        .from("habits")
        .insert({
          user_id: userId,
          title: `[test] Утренняя пробежка ${Date.now()}`,
          why: "Дофамин и BDNF",
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
    habitId = (r.result as any)?.id ?? null;
  }
  if (habitId) {
    const today = new Date().toISOString().slice(0, 10);
    const r = await step("habit_logs.insert", () =>
      sb
        .from("habit_logs")
        .insert({ habit_id: habitId, user_id: userId, done_on: today })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 4) FAMILY_TASKS — create, complete
  let taskId: string | null = null;
  {
    const r = await step("family_tasks.insert", () =>
      sb
        .from("family_tasks")
        .insert({
          created_by: userId,
          assigned_to: userId,
          title: `[test] Помыть посуду ${Date.now()}`,
          category: "home",
          priority: "med",
          points: 10,
          reward_xp: 10,
          status: "open",
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
    taskId = (r.result as any)?.id ?? null;
  }
  if (taskId) {
    const r = await step("family_tasks.complete", () =>
      sb
        .from("family_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", taskId!)
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 5) HEALTH_LOGS — sleep + water
  {
    const r = await step("health_logs.insert sleep", () =>
      sb
        .from("health_logs")
        .insert({
          user_id: userId,
          kind: "sleep",
          occurred_on: new Date().toISOString().slice(0, 10),
          payload: { hours: 7.5, quality: 4 },
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 6) REFLECTIONS
  {
    const today = new Date().toISOString().slice(0, 10);
    const r = await step("reflections.upsert", () =>
      sb
        .from("reflections")
        .upsert(
          {
            user_id: userId,
            occurred_on: today,
            win: "Прошёл онбординг",
            lesson: "Telegram-вход надёжнее email",
            next_step: "Записать первую привычку",
            mood: 4,
          },
          { onConflict: "user_id,occurred_on" } as any,
        )
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 7) SHOPPING_LIST
  {
    const r = await step("shopping_list.insert", () =>
      sb
        .from("shopping_list")
        .insert({
          added_by: userId,
          item: `[test] Хлеб ${Date.now()}`,
          qty: "1 шт",
          category: "bakery",
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 8) NOTIFICATIONS — create + read back
  {
    const r = await step("notifications.insert", () =>
      sb
        .from("notifications")
        .insert({
          user_id: userId,
          actor_id: userId,
          kind: "test",
          title: "Тестовое уведомление",
          body: "test-suite",
        })
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 9) AGENT_PATTERNS — upsert
  {
    const r = await step("agent_patterns.upsert", () =>
      sb
        .from("agent_patterns")
        .upsert({
          user_id: userId,
          pattern_type: "behavior",
          pattern_key: "test_pattern",
          pattern_data: { sample: true },
          confidence: 0.6,
          occurrences: 1,
        }, { onConflict: "user_id,pattern_key" } as any)
        .select()
        .single()
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 10) FAMILY_EVENTS read
  {
    const r = await step("family_events.select", () =>
      sb
        .from("family_events")
        .select("kind, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
        .then((x) => {
          if (x.error) throw x.error;
          return x.data;
        }),
    );
    steps.push(r.step);
  }

  // 11) CLAUDE OPUS 4.7 — direct API call, проверяем что AI реально отвечает
  {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      steps.push({ name: "claude.opus-4-7", ok: false, ms: 0, error: "ANTHROPIC_API_KEY not set" });
    } else {
      const r = await step("claude.opus-4-7 quick test", async () => {
        const a = new Anthropic({ apiKey });
        const resp = await a.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 80,
          messages: [
            {
              role: "user",
              content: "Ответь одним предложением по-русски: ты семейный AI-ассистент, готов помогать?",
            },
          ],
        });
        const text = resp.content
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join(" ");
        return { model: resp.model, text, usage: resp.usage };
      });
      steps.push(r.step);
    }
  }

  // 12) CLAUDE HAIKU 4.5 — для фоновых задач
  {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (apiKey) {
      const r = await step("claude.haiku-4-5 quick test", async () => {
        const a = new Anthropic({ apiKey });
        const resp = await a.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 50,
          messages: [{ role: "user", content: "Скажи коротко: какой сейчас час?" }],
        });
        const text = resp.content
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join(" ");
        return { model: resp.model, text };
      });
      steps.push(r.step);
    }
  }

  // 13) Cleanup test rows (только те что мы создали с префиксом [test])
  {
    const r = await step("cleanup test rows", async () => {
      const a = await sb.from("goals").delete().eq("user_id", userId).like("title", "[test]%");
      const b = await sb.from("habits").delete().eq("user_id", userId).like("title", "[test]%");
      const c = await sb.from("family_tasks").delete().eq("created_by", userId).like("title", "[test]%");
      const d = await sb.from("shopping_list").delete().eq("added_by", userId).like("item", "[test]%");
      const e = await sb.from("notifications").delete().eq("user_id", userId).eq("kind", "test");
      return {
        goals_deleted: a.count ?? null,
        habits_deleted: b.count ?? null,
        tasks_deleted: c.count ?? null,
        shopping_deleted: d.count ?? null,
        notifications_deleted: e.count ?? null,
      };
    });
    steps.push(r.step);
  }

  const ok = steps.filter((s) => s.ok).length;
  const fail = steps.filter((s) => !s.ok).length;

  return NextResponse.json({
    summary: { total: steps.length, ok, fail, user_id: userId },
    steps,
  });
}
