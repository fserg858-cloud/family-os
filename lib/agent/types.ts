export type PatternType = "behavior" | "preference" | "trigger" | "correlation" | "ritual";
export type Outcome = "positive" | "negative" | "pending";
export type EventType =
  | "task_completed"
  | "task_failed"
  | "habit_done"
  | "habit_missed"
  | "health_logged"
  | "reflection_submitted"
  | "chat_message"
  | "mood_logged"
  | "goal_completed"
  | "session_start";

export interface AgentPattern {
  id: string;
  user_id: string;
  pattern_type: PatternType;
  pattern_key: string;
  pattern_data: Record<string, unknown>;
  confidence: number;
  occurrences: number;
  last_confirmed_at: string;
  created_at: string;
}

export interface AgentDecision {
  id: string;
  user_id: string;
  question_normalized: string;
  context_snapshot: Record<string, unknown>;
  decision: string;
  reasoning?: string | null;
  outcome: Outcome;
  used_count: number;
  created_at: string;
}

export interface ProactiveMessage {
  id: string;
  user_id: string;
  trigger_type: string;
  trigger_data?: Record<string, unknown>;
  message: string;
  priority: number;
  sent_at: string;
  read_at?: string | null;
  acted_upon: boolean;
  dismissed: boolean;
}

export interface UserContextProfile {
  id: string;
  name: string;
  role: string;
  age: number;
  ui_profile: string;
  xp: number;
  level: number;
  member_key: string;
}

export interface UserContext {
  user: UserContextProfile;
  habits_summary: { habit: string; done_count: number; streak: number; last_done: string | null }[];
  goals_active: { title: string; type: string; progress: number; target: number; deadline: string | null }[];
  health_last_7_days: { date: string; mood?: number; energy?: number; sleep?: number; water?: number; weight?: number }[];
  mood_trend: number;
  top_patterns: AgentPattern[];
  recent_memory: { role: "system"; content: string }[];
}

export interface LearnEvent {
  event_type: EventType;
  event_data: Record<string, unknown>;
}

export interface AgentMeta {
  patterns: { key: string; type: PatternType; data: Record<string, unknown>; confidence: number }[];
  actions: { type: string; data: Record<string, unknown> }[];
}
