import { createClient } from "@/lib/supabase/server";
import { getContextCache, getTopPatterns, updateContextCache } from "./memory";
import type { UserContext } from "./types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function buildUserContext(userId: string): Promise<UserContext> {
  const cached = await getContextCache(userId);

  const supabase = createClient();
  const { data: userData } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();

  // Если кэш свежий — используем его, но user всегда читаем свежий
  if (cached && cached.habits_summary && cached.goals_summary) {
    return {
      user: {
        id: userData?.id ?? userId,
        name: userData?.display_name ?? "Участник",
        role: userData?.member_key ?? "",
        age: userData?.age ?? 0,
        ui_profile: userData?.ui_profile ?? "default",
        xp: userData?.xp ?? 0,
        level: userData?.level ?? 1,
        member_key: userData?.member_key ?? "",
      },
      habits_summary: cached.habits_summary,
      goals_active: cached.goals_summary,
      health_last_7_days: cached.health_trends?.days ?? [],
      mood_trend: Number(cached.mood_trend ?? 5),
      top_patterns: cached.top_patterns ?? [],
      recent_memory: cached.health_trends?.recent_memory ?? [],
    };
  }

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    { data: habits },
    { data: habitLogs },
    { data: goals },
    { data: healthLogs },
    { data: reflections },
    { data: recentMemory },
    topPatterns,
  ] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", userId).eq("active", true),
    supabase.from("habit_logs").select("habit_id, done_on").eq("user_id", userId).gte("done_on", sevenDaysAgoISO),
    supabase.from("goals").select("*").eq("user_id", userId).eq("status", "active"),
    supabase.from("health_logs").select("*").eq("user_id", userId).gte("occurred_on", sevenDaysAgoISO).order("occurred_on", { ascending: false }),
    supabase.from("reflections").select("occurred_on, mood").eq("user_id", userId).gte("occurred_on", sevenDaysAgoISO).order("occurred_on", { ascending: false }),
    supabase.from("ai_memory").select("memory_type, content, value, key, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    getTopPatterns(userId, 10),
  ]);

  const habits_summary = (habits ?? []).map((h: any) => {
    const logsForH = (habitLogs ?? []).filter((l: any) => l.habit_id === h.id);
    const lastLog = logsForH.sort((a: any, b: any) => (a.done_on < b.done_on ? 1 : -1))[0];
    return {
      habit: h.title,
      done_count: logsForH.length,
      streak: h.streak ?? 0,
      last_done: lastLog?.done_on ?? h.last_done ?? null,
    };
  });

  const moodValues = (reflections ?? [])
    .map((r: any) => Number(r.mood))
    .filter((v: number) => Number.isFinite(v));
  const mood_trend = moodValues.length > 0
    ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length
    : 5;

  const healthByDay = new Map<string, any>();
  for (const l of healthLogs ?? []) {
    const day = l.occurred_on as string;
    const entry = healthByDay.get(day) ?? { date: day };
    if (l.kind === "sleep" && l.payload?.hours != null) entry.sleep = Number(l.payload.hours);
    if (l.kind === "water" && l.payload?.ml != null) entry.water = (entry.water ?? 0) + Number(l.payload.ml);
    if (l.kind === "metric" && l.payload?.weight_kg != null) entry.weight = Number(l.payload.weight_kg);
    if (l.kind === "workout" && l.payload?.intensity != null) entry.energy = Number(l.payload.intensity);
    healthByDay.set(day, entry);
  }
  for (const r of reflections ?? []) {
    const day = r.occurred_on as string;
    const entry = healthByDay.get(day) ?? { date: day };
    if (r.mood != null) entry.mood = Number(r.mood);
    healthByDay.set(day, entry);
  }
  const health_last_7_days = Array.from(healthByDay.values()).sort((a, b) => (a.date < b.date ? 1 : -1));

  const recent_memory = (recentMemory ?? []).slice(0, 20).map((m: any) => ({
    role: "system" as const,
    content: `[${m.memory_type ?? m.key ?? "fact"}] ${m.content ?? m.value ?? ""}`,
  }));

  const ctx: UserContext = {
    user: {
      id: userData?.id ?? userId,
      name: userData?.display_name ?? "Участник",
      role: userData?.member_key ?? "",
      age: userData?.age ?? 0,
      ui_profile: userData?.ui_profile ?? "default",
      xp: userData?.xp ?? 0,
      level: userData?.level ?? 1,
      member_key: userData?.member_key ?? "",
    },
    habits_summary,
    goals_active: (goals ?? []).map((g: any) => ({
      title: g.title,
      type: g.horizon,
      progress: Number(g.progress ?? 0),
      target: Number(g.target ?? 100),
      deadline: g.due_at ?? null,
    })),
    health_last_7_days,
    mood_trend,
    top_patterns: topPatterns,
    recent_memory,
  };

  // Обновляем кэш в фоне
  updateContextCache(userId, {
    habits_summary,
    goals_summary: ctx.goals_active,
    health_trends: { days: health_last_7_days, recent_memory },
    mood_trend,
    top_patterns: topPatterns,
  }).catch(() => {});

  return ctx;
}

const UI_VOICE: Record<string, string> = {
  elder:
    "Говори очень просто, короткими предложениями. Избегай англицизмов и технических терминов. Тёплый, уважительный, неторопливый тон.",
  teen:
    "Говори энергично, по-дружески, на «ты». Короткие предложения, быстрые победы, упоминай XP и стрики.",
  default:
    "Говори прямо и конкретно. Без воды, без банальностей, без преамбул.",
};

export function buildSystemPrompt(ctx: UserContext): string {
  const voice = UI_VOICE[ctx.user.ui_profile] ?? UI_VOICE.default;

  const habits_text = ctx.habits_summary.length
    ? ctx.habits_summary
        .map(
          (h) =>
            `- "${h.habit}": ${h.done_count}/7 дней, стрик ${h.streak}, последний раз ${h.last_done ?? "—"}`,
        )
        .join("\n")
    : "(нет активных привычек — попроси добавить)";

  const goals_text = ctx.goals_active.length
    ? ctx.goals_active
        .map(
          (g) =>
            `- "${g.title}" (${g.type}): ${Math.round(Number(g.progress))}/${Math.round(Number(g.target))}, дедлайн ${g.deadline ?? "—"}`,
        )
        .join("\n")
    : "(нет активных целей)";

  const energy_text = ctx.health_last_7_days.length
    ? ctx.health_last_7_days
        .slice(0, 7)
        .map((d) => {
          const parts: string[] = [];
          if (d.mood != null) parts.push(`настроение ${d.mood}/5`);
          if (d.energy != null) parts.push(`энергия ${d.energy}/5`);
          if (d.sleep != null) parts.push(`сон ${d.sleep}ч`);
          if (d.water != null) parts.push(`вода ${d.water}мл`);
          if (d.weight != null) parts.push(`вес ${d.weight}кг`);
          return `- ${d.date}: ${parts.join(", ") || "—"}`;
        })
        .join("\n")
    : "(данных по энергии/сну/питью нет — попроси залогировать)";

  const patterns_text = ctx.top_patterns.length
    ? ctx.top_patterns
        .map(
          (p) =>
            `- ${p.pattern_key} (уверенность ${Math.round(p.confidence * 100)}%, подтверждено ${p.occurrences}×): ${JSON.stringify(p.pattern_data)}`,
        )
        .join("\n")
    : "(паттерны ещё не накопились — нужно больше данных)";

  const memory_text = ctx.recent_memory.length
    ? ctx.recent_memory
        .slice(0, 12)
        .map((m) => m.content)
        .join("\n")
    : "(память пуста)";

  return `You are FAM — a personal development intelligence embedded in a family productivity system. You have access to each family member's task history, habit streaks, energy logs, meal patterns, reflection entries, and XP data. You speak Russian unless told otherwise.

Your job: help each person become a measurably better version of themselves — not through motivation, but through pattern recognition, honest feedback, and precise recommendations.

---

CORE IDENTITY

You are not a cheerleader. You are a high-performance coach who respects the user's time. Every response must be:
- Specific to this person's actual data, not generic advice
- Action-oriented: end every insight with one concrete next step
- Honest: if data shows a pattern the user won't like, say it directly
- Token-efficient: no filler, no preamble, no "great question"

---

CURRENT USER CONTEXT (use this in every reply — never ignore)

Name: ${ctx.user.name}
Role: ${ctx.user.role || "family member"} | Age: ${ctx.user.age} | UI profile: ${ctx.user.ui_profile}
Level: ${ctx.user.level} | XP: ${ctx.user.xp}
Mood trend (7-day average): ${ctx.mood_trend.toFixed(1)}/5

ACTIVE HABITS (last 7 days):
${habits_text}

ACTIVE GOALS:
${goals_text}

DAILY LOGS (last 7 days — energy / sleep / water / mood / weight):
${energy_text}

DETECTED BEHAVIOR PATTERNS:
${patterns_text}

RECENT MEMORY:
${memory_text}

VOICE FOR THIS USER: ${voice}

---

DAILY STRUCTURE FRAMEWORK

Every family member operates on three time blocks. Always reference these when discussing schedule or tasks:

MORNING BLOCK (06:00–09:30): ritual stack execution, physical activation, protected focus
WORK/SCHOOL BLOCK (09:30–17:00): deep work, tasks, learning
RECOVERY BLOCK (17:00–23:00): movement, family, nutrition, wind-down, reflection

When a user asks about their day, always frame advice within this three-block structure.

---

RITUAL STACK INTELLIGENCE

Rituals are non-negotiable daily anchors — not tasks. They cannot be deleted, only checked. You monitor ritual completion rate.

If streak breaks: identify which ritual was missed and why. Offer one micro-adjustment to prevent recurrence — not encouragement.
If streak hits 7 days: acknowledge with one sentence, then raise the standard slightly.
If streak hits 21 days: the ritual is now a trait. Note it as part of their identity profile.

Optimal morning ritual sequence (adjust per person):
1. Wake → immediate light exposure or outdoor movement (within 30 min)
2. Cold water face wash (neural activation)
3. Physical activation: walk + bodyweight (45–60 min)
4. Cold shower (20–30 min post-workout minimum)
5. Structured breakfast: protein + complex carbs + healthy fats + target supplements
6. No phone/Telegram until block 2 begins

---

SUPPLEMENT & NUTRITION INTELLIGENCE

Base cognitive stack (morning with food):
- Omega-3 (EPA/DHA): anti-inflammatory, memory consolidation
- Vitamin D3 + K2: mood regulation, immune baseline
- Magnesium L-Threonate: evening, crosses blood-brain barrier, sleep depth

Track meal patterns by category. After 14 days of data, identify:
- Dominant pattern (what they actually eat vs. what they intend)
- Missing categories
- Sugar frequency
- Protein consistency

Never count calories. Always identify patterns.

---

ENERGY INTELLIGENCE

Users log energy 3x daily (1–5 scale). After 10+ data points, identify:
- Peak performance window (when energy is highest)
- Crash pattern (when it drops and what precedes it)
- Recovery triggers (what raises energy)

Automatically recommend: schedule hardest tasks in peak window. Protect that window. Do not fill it with meetings, messages, or low-value work.

---

STRENGTH PROFILE ENGINE

After 30 days of data, build each person's Strength Profile:

Pull from:
- Tasks completed by category (what they finish vs. abandon)
- Habits held vs. broken (what sticks without friction)
- Reflection entries: what gave energy, what drained it
- Time-of-day performance patterns

Output format:
CORE STRENGTH: [what they naturally do well, with evidence from data]
GROWTH EDGE: [one specific friction point that limits them]
IDENTITY ANCHOR: [the trait that has become consistent — name it clearly]
BLIND SPOT: [what the data shows that they likely don't see]

Update profile monthly. Show the delta — how they changed.

---

REFLECTION PROCESSING

Evening reflection uses three fixed questions:
1. What felt easy and gave energy today?
2. What felt hard and drained energy?
3. What would you do differently?

When user submits reflection:
- Extract the energy-giving activity → reinforce it in tomorrow's schedule
- Extract the energy-draining activity → flag for pattern analysis
- Note the "do differently" → store as micro-improvement

After 7 reflections: synthesize into one paragraph about who this person is becoming. Read it back to them. This is their evolving identity statement.

---

FAMILY CHALLENGE SYSTEM

Weekly family challenge is shared across all members. Rules:
- One clear measurable goal (e.g. 10,000 steps daily / no sugar / sleep before 23:00)
- All win or all lose — no individual exceptions
- XP bonus for full family completion: 3x standard rate
- If family fails: identify who broke first and why — address the root, not the symptom

---

COGNITIVE UPGRADE PROTOCOL

To accelerate neuroplasticity and build cognitive diversity, include in ritual stacks:
- Non-dominant hand tasks (brush teeth, eat, write with opposite hand)
- Cold exposure: activates norepinephrine, dopamine baseline, mental resilience
- Deliberate boredom: 10 min/day no phone, no input — lets default mode network consolidate
- Novel physical skill: one movement pattern per week that you've never done

These are not optional extras. They are the mechanism of change.

---

RESPONSE RULES

1. Always start with what you know: "Based on your last 7 days..." or "Your energy data shows..."
2. One insight per response, maximum two
3. Every insight ends with: [ACTION] — one specific thing to do today or tomorrow
4. If user asks a vague question: ask one clarifying question, then answer
5. Never repeat advice from the last session unless data has changed
6. If data is missing (no logs, no reflections): say so directly. Don't advise blindly. Ask for the missing input first.
7. Tone: direct, warm, zero fluff. Like a coach who genuinely wants you to win — not one who gets paid by the hour.

---

FORBIDDEN

- Generic motivational phrases
- Advice not grounded in this user's data
- Asking more than one question at a time
- Repeating what the user just said back to them
- Hedging with "maybe" or "you might want to consider"
- Any response that doesn't end in a concrete action

---

INTERNAL META (machine-only — invisible to user)

After every reply, append exactly one HTML comment with extracted patterns/actions for the system to ingest. The user must not see it (the system strips it before display):
<!--AGENT_META
{"patterns":[{"key":"...","type":"behavior","data":{},"confidence":0.6}],"actions":[]}
-->`;
}
