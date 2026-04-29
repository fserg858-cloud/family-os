import Link from "next/link";
import { LogOut, Sparkles, Repeat, Target, HeartPulse, Moon, BookOpen, ShoppingCart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { MemberAvatar } from "@/components/member-avatar";
import { AchievementCard } from "@/components/achievement-card";
import { Progress } from "@/components/ui/progress";
import { ProfileLogout } from "./profile-logout";
import { TaskCardServer } from "../dashboard/task-card-server";
import { getMember } from "@/lib/members";
import { xpProgress, streakCopy } from "@/lib/xp";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = createClient();
  const today = todayISO();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: tasks }, { data: doneTasks }, { data: achievements }] = await Promise.all([
    supabase
      .from("family_tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .neq("status", "done")
      .order("due_at", { ascending: true })
      .limit(5),
    supabase
      .from("family_tasks")
      .select("id")
      .eq("assigned_to", user.id)
      .eq("status", "done")
      .gte("completed_at", startOfDay.toISOString()),
    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(6),
  ]);

  const def = getMember(user.member_key);
  const xp = xpProgress(user.xp);

  return (
    <AppShell user={user}>
      <section
        className="rounded-3xl p-6 -mx-1"
        style={{
          background: `linear-gradient(180deg, ${def?.color}33 0%, transparent 100%)`,
          border: `1px solid ${def?.color}55`,
        }}
      >
        <div className="flex flex-col items-center text-center">
          <MemberAvatar memberKey={user.member_key} size="xl" />
          <h1 className="text-2xl font-semibold mt-4" style={{ color: def?.color }}>
            {user.display_name}
          </h1>
          <div className="text-xs text-muted">{def?.role}</div>
          <div className="mt-4 w-full max-w-[260px]">
            <div className="flex items-baseline justify-between text-[11px] text-muted">
              <span>Уровень {xp.level}</span>
              <span>{xp.into} / {xp.max}</span>
            </div>
            <Progress value={xp.percent} className="mt-1.5" color={def?.color ?? "#FF6B8A"} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Задач сегодня" value={(doneTasks ?? []).length} />
          <Stat label="Серия" value={streakCopy(user.streak_days)} small />
          <Stat label="XP всего" value={user.xp} />
        </div>
      </section>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Достижения
      </h3>
      <div className="space-y-2">
        {(achievements ?? []).length === 0 && (
          <div className="surface p-4 text-center text-muted text-sm">
            Пусто. Закрывай задачи и привычки — здесь появятся.
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

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Задачи на сегодня
      </h3>
      <div className="space-y-2">
        {(tasks ?? []).length === 0 ? (
          <div className="surface p-4 text-center text-muted text-sm">Свободно</div>
        ) : (
          (tasks ?? []).map((t: any) => (
            <TaskCardServer key={t.id} task={t} memberKey={user.member_key} />
          ))
        )}
      </div>

      <h3 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium mt-8 mb-3">
        Разделы
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <NavCard href="/assistant" Icon={Sparkles} label="AI ассистент" />
        <NavCard href="/habits" Icon={Repeat} label="Привычки" />
        <NavCard href="/goals" Icon={Target} label="Цели" />
        <NavCard href="/health" Icon={HeartPulse} label="Здоровье" />
        <NavCard href="/reflection" Icon={Moon} label="Рефлексия" />
        <NavCard href="/growth" Icon={BookOpen} label="Развитие" />
        <NavCard href="/shopping" Icon={ShoppingCart} label="Покупки" />
        <NavCard href="/report" Icon={Sparkles} label="Отчёт недели" />
      </div>

      <div className="mt-8">
        <ProfileLogout />
      </div>
    </AppShell>
  );
}

function Stat({ label, value, small }: { label: string; value: any; small?: boolean }) {
  return (
    <div className="surface p-3 text-center">
      <div className={small ? "text-base font-semibold" : "text-2xl font-semibold"}>{value}</div>
      <div className="text-[10px] text-muted mt-1 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function NavCard({ href, Icon, label }: { href: string; Icon: any; label: string }) {
  return (
    <Link href={href} className="surface p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
        <Icon size={18} className="text-accent" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
