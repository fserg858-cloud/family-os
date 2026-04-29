import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardLabel } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GrowthClient } from "./growth-client";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: comps }, { data: content }, { data: achievements }] = await Promise.all([
    supabase.from("competencies").select("*").eq("user_id", user.id),
    supabase.from("learning_content").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: false }),
  ]);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>Развитие</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">КАРТА</h1>
        <p className="text-muted text-sm mt-2">Компетенции, материалы, летопись достижений.</p>
      </header>

      <section className="mb-8">
        <CardLabel>Компетенции</CardLabel>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {(comps ?? []).length === 0 && (
            <Card className="text-muted text-sm">Добавь первую компетенцию ниже.</Card>
          )}
          {(comps ?? []).map((c: any) => (
            <Card key={c.id}>
              <div className="flex justify-between">
                <div>
                  <div className="text-text">{c.name}</div>
                  <div className="text-xs text-muted">{c.category ?? "общая"}</div>
                </div>
                <div className="display text-2xl text-accent">L{c.level}</div>
              </div>
              <Progress value={Number(c.progress)} className="mt-3" />
            </Card>
          ))}
        </div>
      </section>

      <GrowthClient
        initialContent={content ?? []}
        existingComps={(comps ?? []).map((c: any) => c.name)}
      />

      <section className="mt-8">
        <CardLabel>Летопись</CardLabel>
        <div className="mt-3 space-y-2">
          {(achievements ?? []).length === 0 && (
            <Card className="text-muted text-sm">Достижения появятся, когда ты выполнишь цели и стрики.</Card>
          )}
          {(achievements ?? []).map((a: any) => (
            <Card key={a.id}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-text">{a.title}</div>
                  {a.description && <div className="text-xs text-muted">{a.description}</div>}
                </div>
                <div className="text-xs text-muted">
                  {new Date(a.earned_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
