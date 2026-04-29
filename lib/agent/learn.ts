import { createClient } from "@/lib/supabase/server";
import { upsertPattern } from "./memory";
import type { EventType } from "./types";

// Серверный fire-and-forget хук обучения. Никогда не должен бросать наружу.
export async function recordEvent(
  userId: string,
  eventType: EventType | string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const sb = createClient();
    await sb.from("agent_learning_log").insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
    });

    // Эвристика: 3 пропуска подряд по одной привычке -> streak_risk
    if (eventType === "habit_missed" && eventData?.habit_id) {
      const { data: lastEvents } = await sb
        .from("agent_learning_log")
        .select("event_type, event_data")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);
      const sameHabit = (lastEvents ?? []).filter(
        (e: any) => e.event_data?.habit_id === eventData.habit_id,
      );
      if (sameHabit.length >= 3 && sameHabit.slice(0, 3).every((e: any) => e.event_type === "habit_missed")) {
        await upsertPattern(
          userId,
          `streak_risk_${(eventData.habit_title as string) ?? eventData.habit_id}`,
          "trigger",
          { habit_id: eventData.habit_id, habit_title: eventData.habit_title },
          0.15,
        );
      }
    }

    // Эвристика: два дня подряд mood < 4
    if (eventType === "reflection_submitted" || eventType === "mood_logged") {
      const { data: moods } = await sb
        .from("agent_learning_log")
        .select("event_data, created_at")
        .eq("user_id", userId)
        .in("event_type", ["reflection_submitted", "mood_logged"])
        .order("created_at", { ascending: false })
        .limit(2);
      if ((moods ?? []).length === 2) {
        const vals = (moods ?? [])
          .map((m: any) => Number(m.event_data?.mood ?? m.event_data?.value))
          .filter((v: number) => Number.isFinite(v));
        if (vals.length === 2 && vals.every((v) => v < 4)) {
          await upsertPattern(userId, "low_mood_consecutive", "trigger", { last_two: vals }, 0.15);
        }
      }
    }
  } catch {
    /* never throw from learn helper */
  }
}
