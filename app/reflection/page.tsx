import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ReflectionClient } from "./reflection-client";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReflectionPage() {
  const user = await requireUser();
  const supabase = createClient();
  const today = todayISO();
  const [{ data: todayRow }, { data: history }] = await Promise.all([
    supabase
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .eq("occurred_on", today)
      .maybeSingle(),
    supabase
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false })
      .limit(7),
  ]);
  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Рефлексия</h1>
        <p className="text-xs text-muted mt-1">15 минут вечером — мощнее, чем кажется</p>
      </header>
      <ReflectionClient existing={todayRow ?? null} />
      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Последние 7 дней
      </h3>
      <div className="space-y-2">
        {(history ?? []).filter((r: any) => r.occurred_on !== today).length === 0 && (
          <div className="surface p-4 text-center text-sm text-muted">Пока нет записей</div>
        )}
        {(history ?? [])
          .filter((r: any) => r.occurred_on !== today)
          .map((r: any) => (
            <div key={r.id} className="surface p-3">
              <div className="text-[10px] text-muted">{r.occurred_on}</div>
              {r.win && <div className="mt-1 text-sm"><span className="text-accent">Победа: </span>{r.win}</div>}
              {r.lesson && <div className="text-sm"><span className="text-accent">Урок: </span>{r.lesson}</div>}
              {r.next_step && <div className="text-sm"><span className="text-accent">Шаг: </span>{r.next_step}</div>}
              {r.ai_insight && (
                <div className="mt-2 text-[13px] text-text/80 border-l-2 border-accent pl-3 whitespace-pre-wrap">
                  {r.ai_insight}
                </div>
              )}
            </div>
          ))}
      </div>
    </AppShell>
  );
}
