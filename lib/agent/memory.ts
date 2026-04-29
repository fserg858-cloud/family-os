import { createClient } from "@/lib/supabase/server";
import type { AgentDecision, AgentPattern, ProactiveMessage } from "./types";

// Топ паттерны пользователя по уверенности (с учётом порога)
export async function getTopPatterns(userId: string, limit = 10): Promise<AgentPattern[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agent_patterns")
    .select("*")
    .eq("user_id", userId)
    .gte("confidence", 0.5)
    .order("confidence", { ascending: false })
    .limit(limit);
  return (data ?? []) as AgentPattern[];
}

// Создать или обновить паттерн (бамп уверенности)
export async function upsertPattern(
  userId: string,
  patternKey: string,
  patternType: string,
  patternData: Record<string, unknown>,
  confidenceDelta = 0.05,
): Promise<void> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("agent_patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("pattern_key", patternKey)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("agent_patterns")
      .update({
        occurrences: (existing.occurrences ?? 1) + 1,
        confidence: Math.min(0.95, Number(existing.confidence ?? 0.5) + confidenceDelta),
        pattern_data: { ...(existing.pattern_data ?? {}), ...patternData },
        last_confirmed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("agent_patterns").insert({
      user_id: userId,
      pattern_key: patternKey,
      pattern_type: patternType,
      pattern_data: patternData,
      confidence: 0.5,
    });
  }
}

// Похожее решение по ключевым словам
export async function findSimilarDecision(userId: string, question: string): Promise<AgentDecision | null> {
  const supabase = createClient();
  const normalized = question.toLowerCase().trim().slice(0, 100);
  const keywords = normalized
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);
  if (!keywords.length) return null;

  const orFilter = keywords.map((k) => `question_normalized.ilike.%${k}%`).join(",");

  const { data } = await supabase
    .from("agent_decisions")
    .select("*")
    .eq("user_id", userId)
    .eq("outcome", "positive")
    .gt("used_count", 0)
    .or(orFilter)
    .order("used_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as AgentDecision) ?? null;
}

// Сохранить решение
export async function saveDecision(
  userId: string,
  question: string,
  decision: string,
  reasoning: string,
  contextSnapshot: Record<string, unknown>,
): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agent_decisions")
    .insert({
      user_id: userId,
      question_normalized: question.toLowerCase().trim().slice(0, 200),
      decision,
      reasoning,
      context_snapshot: contextSnapshot,
    })
    .select("id")
    .single();
  return data?.id ?? "";
}

// Обновить исход решения и инкремент use_count
export async function markDecisionOutcome(decisionId: string, outcome: "positive" | "negative"): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("bump_decision", { p_id: decisionId, p_outcome: outcome });
}

// Сохранить проактивное сообщение с защитой от повторов в пределах 24 часов
export async function saveProactiveMessage(
  userId: string,
  triggerType: string,
  message: string,
  priority: number,
  triggerData: Record<string, unknown> = {},
): Promise<boolean> {
  const supabase = createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("agent_proactive_messages")
    .select("id")
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .gte("sent_at", yesterday)
    .limit(1)
    .maybeSingle();

  if (recent) return false;

  await supabase.from("agent_proactive_messages").insert({
    user_id: userId,
    trigger_type: triggerType,
    message,
    priority,
    trigger_data: triggerData,
  });
  return true;
}

// Непрочитанное сообщение наивысшего приоритета
export async function getUnreadProactiveMessage(userId: string): Promise<ProactiveMessage | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agent_proactive_messages")
    .select("*")
    .eq("user_id", userId)
    .is("read_at", null)
    .eq("dismissed", false)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ProactiveMessage) ?? null;
}

// Пометить сообщение как прочитанное
export async function markMessageRead(messageId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("agent_proactive_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId);
}

// Получить кэш контекста, если он свежий (< 1 часа)
export async function getContextCache(userId: string): Promise<any | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agent_context_cache")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const ageMs = Date.now() - new Date(data.updated_at).getTime();
  if (ageMs > 60 * 60 * 1000) return null;
  return data;
}

// Записать кэш контекста
export async function updateContextCache(userId: string, payload: Record<string, unknown>): Promise<void> {
  const supabase = createClient();
  await supabase.from("agent_context_cache").upsert({
    user_id: userId,
    ...payload,
    updated_at: new Date().toISOString(),
  });
}
