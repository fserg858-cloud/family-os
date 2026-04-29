import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { AchievementCard } from "@/components/achievement-card";
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
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Развитие</h1>
        <p className="text-xs text-muted mt-1">Компетенции, материалы, летопись</p>
      </header>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
        Компетенции
      </h3>
      <div className="space-y-2">
        {(comps ?? []).length === 0 && (
          <div className="surface p-4 text-center text-sm text-muted">
            Добавь первую компетенцию ниже
          </div>
        )}
        {(comps ?? []).map((c: any) => (
          <div key={c.id} className="surface p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[15px]">{c.name}</div>
                <div className="text-[11px] text-muted">{c.category ?? "общая"}</div>
              </div>
              <div className="text-xl font-semibold text-accent">L{c.level}</div>
            </div>
            <Progress value={Number(c.progress)} className="mt-2" />
          </div>
        ))}
      </div>

      <GrowthClient
        initialContent={content ?? []}
        existingComps={(comps ?? []).map((c: any) => c.name)}
      />

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Летопись
      </h3>
      <div className="space-y-2">
        {(achievements ?? []).length === 0 && (
          <div className="surface p-4 text-center text-sm text-muted">
            Достижения появятся, когда выполнишь цели и стрики.
          </div>
        )}
        {(achievements ?? []).map((a: any) => (
          <AchievementCard
            key={a.id}
            title={a.title}
            description={a.description}
            earned_at={a.earned_at}
          />
        ))}
      </div>
    </AppShell>
  );
}
