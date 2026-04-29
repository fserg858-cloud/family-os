import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardLabel } from "@/components/ui/card";
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
      <header className="mb-6">
        <CardLabel>Рефлексия</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">ВЕЧЕР</h1>
        <p className="text-muted text-sm mt-2">
          15 минут вечерней метакогниции усиливают консолидацию памяти во сне.
        </p>
      </header>

      <ReflectionClient existing={todayRow ?? null} />

      <section className="mt-8">
        <CardLabel>Последние 7 дней</CardLabel>
        <div className="mt-3 space-y-2">
          {(history ?? []).filter((r: any) => r.occurred_on !== today).length === 0 && (
            <Card className="text-muted text-sm">Пока нет записей</Card>
          )}
          {(history ?? [])
            .filter((r: any) => r.occurred_on !== today)
            .map((r: any) => (
              <Card key={r.id}>
                <div className="text-xs text-muted">{r.occurred_on}</div>
                {r.win && <div className="mt-1 text-text"><span className="text-accent">Победа: </span>{r.win}</div>}
                {r.lesson && <div className="text-text"><span className="text-accent">Урок: </span>{r.lesson}</div>}
                {r.next_step && <div className="text-text"><span className="text-accent">Шаг: </span>{r.next_step}</div>}
                {r.ai_insight && (
                  <div className="mt-3 text-sm text-text/80 border-l-2 border-accent pl-3 whitespace-pre-wrap">
                    {r.ai_insight}
                  </div>
                )}
              </Card>
            ))}
        </div>
      </section>
    </AppShell>
  );
}
