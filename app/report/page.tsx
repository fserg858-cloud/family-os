import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardLabel } from "@/components/ui/card";
import { ReportClient } from "./report-client";

export const dynamic = "force-dynamic";

function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default async function ReportPage() {
  const user = await requireUser();
  const supabase = createClient();
  const monday = startOfWeek();
  const weekStart = monday.toISOString().slice(0, 10);

  const [
    { data: latest },
    { data: events },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("family_reports")
      .select("*")
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("family_events")
      .select("*")
      .gte("created_at", monday.toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, display_name, xp, level"),
  ]);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>Отчёт недели</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">FAMILY REPORT</h1>
        <p className="text-muted text-sm mt-2">Неделя с {weekStart}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {(members ?? []).map((m: any) => (
          <Card key={m.id}>
            <div className="text-text">{m.display_name}</div>
            <div className="display text-3xl text-accent mt-1">L{m.level}</div>
            <div className="text-xs text-muted">{m.xp} XP всего</div>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardLabel>События недели</CardLabel>
        <div className="text-text mt-2 display text-4xl">{events?.length ?? 0}</div>
        <div className="text-xs text-muted">записей в семейной ленте</div>
      </Card>

      <ReportClient weekStart={weekStart} initial={latest ?? null} />
    </AppShell>
  );
}
