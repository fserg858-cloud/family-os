import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ReportClient } from "./report-client";
import { MemberAvatar } from "@/components/member-avatar";
import { Progress } from "@/components/ui/progress";
import { xpProgress } from "@/lib/xp";
import { getMember } from "@/lib/members";

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

  const [{ data: latest }, { data: events }, { data: members }] = await Promise.all([
    supabase.from("family_reports").select("*").eq("week_start", weekStart).maybeSingle(),
    supabase
      .from("family_events")
      .select("id")
      .gte("created_at", monday.toISOString()),
    supabase
      .from("users")
      .select("id, display_name, xp, level, member_key")
      .order("xp", { ascending: false }),
  ]);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Отчёт недели</h1>
        <p className="text-xs text-muted mt-1">с {weekStart}</p>
      </header>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mb-3">
        Семья
      </h3>
      <div className="space-y-2 mb-6">
        {(members ?? []).map((m: any) => {
          const def = getMember(m.member_key);
          const xp = xpProgress(m.xp);
          return (
            <div key={m.id} className="surface p-3 flex items-center gap-3">
              <MemberAvatar memberKey={m.member_key} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px]" style={{ color: def?.color }}>
                  {m.display_name}
                </div>
                <div className="text-[11px] text-muted">L{m.level} · {m.xp} XP</div>
                <Progress value={xp.percent} className="mt-1.5" color={def?.color ?? "#FF6B8A"} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface p-4 mb-6">
        <div className="text-[11px] text-muted uppercase tracking-widest">События недели</div>
        <div className="text-3xl font-semibold mt-1">{(events ?? []).length}</div>
      </div>

      <ReportClient weekStart={weekStart} initial={(latest as any) ?? null} />
    </AppShell>
  );
}
