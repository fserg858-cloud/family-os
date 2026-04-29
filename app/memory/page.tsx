import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { MemoryClient } from "./memory-client";
import type { AgentDecision, AgentPattern } from "@/lib/agent/types";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const user = await requireUser();
  const sb = createClient();
  const [{ data: patterns }, { data: decisions }, { data: insights }] = await Promise.all([
    sb.from("agent_patterns").select("*").eq("user_id", user.id).order("confidence", { ascending: false }),
    sb.from("agent_decisions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    sb.from("ai_memory").select("id, memory_type, content, value, key, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Память</h1>
        <p className="text-xs text-muted mt-1">Что агент знает о тебе</p>
      </header>
      <MemoryClient
        initialPatterns={(patterns ?? []) as AgentPattern[]}
        initialDecisions={(decisions ?? []) as AgentDecision[]}
        initialInsights={(insights ?? []) as any[]}
      />
    </AppShell>
  );
}
