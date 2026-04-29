import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { todayISO } from "@/lib/utils";
import { MEMBERS } from "@/lib/members";

export const dynamic = "force-dynamic";

const SCIENCE_TIPS = [
  {
    title: "Утренний свет за 10 минут — якорь для циркадных ритмов",
    text:
      "Свет 10 000 лк через сетчатку запускает супрахиазматическое ядро, оно подавляет мелатонин и сдвигает кортизоловый пик в нужное время. Ночью мелатонин выйдет тогда, когда нужно — спать будет легче.",
  },
  {
    title: "Силовая тренировка повышает BDNF — белок роста нейронов",
    text:
      "30–45 минут с весом ≥ 70% 1ПМ повышают BDNF на 2–4 часа. Это ускоряет миелинизацию и улучшает память: учить новое лучше в 2-часовом окне после тренировки.",
  },
  {
    title: "Холодный душ 60 сек поднимает дофамин до +250%",
    text:
      "Это не «бодрость», а 4-часовое окно стабильного дофаминового фона. Лучшая часть: дофамин не падает в дефицит, как от кофеина или сахара.",
  },
  {
    title: "Глубокий сон до 1:00 — 70% всей репарации",
    text:
      "Гормон роста и тестостерон синтезируются в первой трети ночи. Лечь в 23:30, а не в 1:30 — это +30% к восстановлению при том же количестве часов.",
  },
  {
    title: "Белок 1.6 г/кг разгоняет mTOR и сохраняет мышцы",
    text:
      "Лейцин выше порога 2.5 г за приём активирует mTOR. Это удерживает мышечную массу даже при дефиците калорий — энергия днём не падает.",
  },
];

function pickTip(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return SCIENCE_TIPS[Math.abs(h) % SCIENCE_TIPS.length];
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const today = todayISO();
  const member = MEMBERS[user.member_key];

  const [{ data: habits }, { data: goals }, { data: todayLogs }, { data: tasks }] =
    await Promise.all([
      supabase.from("habits").select("*").eq("active", true).order("created_at"),
      supabase.from("goals").select("*").eq("status", "active").order("created_at"),
      supabase.from("habit_logs").select("habit_id").eq("done_on", today),
      supabase
        .from("family_tasks")
        .select("*")
        .eq("assigned_to", user.id)
        .neq("status", "done")
        .order("due_at", { ascending: true })
        .limit(3),
    ]);

  const doneHabits = new Set((todayLogs ?? []).map((l: any) => l.habit_id));
  const habitsTotal = habits?.length ?? 0;
  const habitsDone = habits?.filter((h: any) => doneHabits.has(h.id)).length ?? 0;
  const habitPercent = habitsTotal ? (habitsDone / habitsTotal) * 100 : 0;

  const tip = pickTip(`${user.id}-${today}`);

  const priorities = [
    habitsTotal > habitsDone
      ? `Закрыть привычки на сегодня (${habitsDone}/${habitsTotal})`
      : "Привычки на сегодня закрыты — отметь рефлексию",
    goals?.[0]?.title
      ? `Цель: ${goals[0].title} (${Math.round(Number(goals[0].progress))}%)`
      : "Поставить цель на неделю",
    tasks?.[0]?.title ?? "Свободный фокус — выбери самое важное",
  ];

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>{today}</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">
          ДОБРОЕ УТРО, {member.display_name.toUpperCase()}
        </h1>
        <div className="text-muted text-sm mt-2">{member.role}</div>
      </header>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardLabel>Уровень</CardLabel>
          <div className="display text-4xl text-text mt-1">{user.level}</div>
          <div className="text-xs text-muted mt-2">{user.xp} XP всего</div>
        </Card>
        <Card>
          <CardLabel>Стрик</CardLabel>
          <div className="display text-4xl text-accent mt-1">{user.streak_days}</div>
          <div className="text-xs text-muted mt-2">дней подряд</div>
        </Card>
        <Card>
          <CardLabel>Привычки сегодня</CardLabel>
          <div className="display text-4xl text-text mt-1">
            {habitsDone}<span className="text-muted text-2xl">/{habitsTotal}</span>
          </div>
          <Progress value={habitPercent} className="mt-3" />
        </Card>
      </div>

      <Card className="mb-6">
        <CardTitle>3 ПРИОРИТЕТА НА СЕГОДНЯ</CardTitle>
        <ol className="space-y-3 mt-2">
          {priorities.map((p, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="display text-accent text-xl w-6">{i + 1}</span>
              <span className="text-text">{p}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mb-6">
        <CardLabel>Научный инсайт дня</CardLabel>
        <CardTitle className="mt-2">{tip.title}</CardTitle>
        <div className="text-text/90 leading-relaxed">{tip.text}</div>
      </Card>

      <Card>
        <CardTitle>Быстрые действия</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/habits" className="surface-2 px-4 py-4 text-center hover:border-accent hover:text-accent transition-colors">
            Привычки
          </Link>
          <Link href="/health" className="surface-2 px-4 py-4 text-center hover:border-accent hover:text-accent transition-colors">
            Записать еду
          </Link>
          <Link href="/assistant" className="surface-2 px-4 py-4 text-center hover:border-accent hover:text-accent transition-colors">
            Спросить AI
          </Link>
          <Link href="/reflection" className="surface-2 px-4 py-4 text-center hover:border-accent hover:text-accent transition-colors">
            Рефлексия
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
