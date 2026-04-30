import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ProgressRing } from "@/components/progress-ring";
import { MemberAvatar } from "@/components/member-avatar";
import { SectionHeader } from "@/components/ui/card";
import { TaskCardServer } from "./task-card-server";
import { ProactiveSlot } from "./proactive-slot";
import { todayISO } from "@/lib/utils";
import { getMember } from "@/lib/members";
import { getServerLocale } from "@/lib/preferences";
import { t, type TKey } from "@/lib/i18n";
import type { ProactiveMessage as ProactiveMessageT } from "@/lib/agent/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const today = todayISO();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { data: members },
    { data: myTasks },
    { data: events },
    { data: notifs },
    { data: proactive },
  ] = await Promise.all([
    supabase.from("users").select("id, display_name, member_key, level, xp"),
    supabase
      .from("family_tasks")
      .select("*")
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("family_events")
      .select("id, actor_id, kind, payload, created_at")
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("notifications").select("id").eq("user_id", user.id).eq("read", false),
    supabase
      .from("agent_proactive_messages")
      .select("*")
      .eq("user_id", user.id)
      .is("read_at", null)
      .eq("dismissed", false)
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const todayTasks = (myTasks ?? []).filter((t: any) => {
    if (!t.due_at) return t.status !== "done";
    const d = new Date(t.due_at);
    return d.toDateString() === new Date().toDateString();
  });
  const totalToday = todayTasks.length;
  const doneToday = todayTasks.filter((t: any) => t.status === "done").length;
  const pct = totalToday ? (doneToday / totalToday) * 100 : 0;

  const memberMap = new Map((members ?? []).map((m: any) => [m.id, m]));
  const locale = getServerLocale();
  const tr = (k: TKey) => t(k, locale);
  const dateLocale = locale === "en" ? "en-US" : "ru-RU";

  return (
    <AppShell user={user} unread={(notifs ?? []).length}>
      {proactive && (
        <div className="pt-2">
          <ProactiveSlot initial={proactive as ProactiveMessageT} />
        </div>
      )}
      <section className="pt-2 pb-6 flex flex-col items-center">
        <p className="text-sm text-muted mb-3">{new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}</p>
        <ProgressRing value={pct} size={180} stroke={14}>
          <div className="text-4xl font-semibold">{doneToday}<span className="text-muted text-2xl">/{totalToday || 0}</span></div>
          <div className="text-xs text-muted uppercase tracking-widest mt-1">{tr("dash.today")}</div>
        </ProgressRing>
      </section>

      <div className="grid grid-cols-3 gap-2 -mx-1 mb-2">
        <Link href="/calendar" className="surface p-3 flex flex-col items-center gap-1 active:scale-[0.98] transition-transform">
          <span className="text-xl">📅</span>
          <span className="text-[11px] text-muted">{tr("dash.shortcut.calendar")}</span>
        </Link>
        <Link href="/menu" className="surface p-3 flex flex-col items-center gap-1 active:scale-[0.98] transition-transform">
          <span className="text-xl">🍽️</span>
          <span className="text-[11px] text-muted">{tr("dash.shortcut.menu")}</span>
        </Link>
        <Link href="/shopping" className="surface p-3 flex flex-col items-center gap-1 active:scale-[0.98] transition-transform">
          <span className="text-xl">🛒</span>
          <span className="text-[11px] text-muted">{tr("dash.shortcut.shopping")}</span>
        </Link>
      </div>

      <SectionHeader title={tr("dash.family")} action={<Link href="/family" className="text-xs text-accent">{tr("dash.see_all")}</Link>} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
        {(members ?? []).map((m: any) => {
          const def = getMember(m.member_key);
          return (
            <Link key={m.id} href={`/family?u=${m.id}`} className="shrink-0 flex flex-col items-center gap-1.5">
              <MemberAvatar memberKey={m.member_key} size="md" />
              <div className="text-[11px]" style={{ color: def?.color }}>{m.display_name}</div>
              <div className="text-[10px] text-muted">L{m.level}</div>
            </Link>
          );
        })}
      </div>

      <SectionHeader title={tr("dash.today_tasks")} action={<Link href="/tasks" className="text-xs text-accent">{tr("dash.see_all")}</Link>} />
      <div className="space-y-2">
        {todayTasks.length === 0 && (
          <div className="surface p-4 text-sm text-muted text-center">
            {tr("dash.free_day")} <Link href="/tasks/create" className="text-accent">{tr("dash.add_task_inline")}</Link>.
          </div>
        )}
        {todayTasks.slice(0, 5).map((t: any) => {
          const ass = t.assigned_to ? memberMap.get(t.assigned_to) : null;
          return (
            <TaskCardServer
              key={t.id}
              task={t}
              memberKey={(ass as any)?.member_key ?? null}
            />
          );
        })}
      </div>

      <SectionHeader title={tr("dash.events")} action={<Link href="/events" className="text-xs text-accent">{tr("dash.history")}</Link>} />
      <div className="space-y-2">
        {(events ?? []).length === 0 && <div className="surface p-4 text-sm text-muted text-center">{tr("dash.quiet")}</div>}
        {(events ?? []).map((e: any) => {
          const actor: any = e.actor_id ? memberMap.get(e.actor_id) : null;
          const def = getMember(actor?.member_key);
          return (
            <div key={e.id} className="flex gap-3 items-start surface p-3">
              <div
                className="self-stretch w-1 rounded-full"
                style={{ background: def?.color ?? "#8E8E93" }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span style={{ color: def?.color ?? "#FFF" }} className="font-medium">{actor?.display_name ?? "Кто-то"}</span>{" "}
                  <span className="text-muted">{describeEvent(e)}</span>
                </div>
                <div className="text-[10px] text-muted mt-0.5">
                  {new Date(e.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function describeEvent(e: any) {
  switch (e.kind) {
    case "habit_logged":
      return `закрыл привычку «${e.payload?.title ?? ""}»`;
    case "task_completed":
      return `выполнил задачу «${e.payload?.title ?? ""}» (+${e.payload?.xp ?? 0} XP)`;
    case "task_created":
      return `добавил задачу «${e.payload?.title ?? ""}»`;
    case "reflection_saved":
      return "записал рефлексию";
    case "goal_completed":
      return `достиг цели «${e.payload?.title ?? ""}»`;
    case "challenge_progress":
      return `продвинулся в челлендже «${e.payload?.title ?? ""}»`;
    case "shopping_added":
      return `добавил в список «${e.payload?.item ?? ""}»`;
    default:
      return e.kind;
  }
}
