import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CardLabel } from "@/components/ui/card";
import { AssistantClient } from "./assistant-client";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: history } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(40);

  return (
    <AppShell user={user}>
      <header className="mb-6">
        <CardLabel>AI Ассистент</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">ОРАКУЛ</h1>
        <p className="text-muted text-sm mt-2">
          Любой ответ приходит в формате: Факт → Механизм → Что значит для тебя →
          Следующий шаг → Результат через 7/30/90 дней.
        </p>
      </header>
      <AssistantClient history={history ?? []} memberName={user.display_name} />
    </AppShell>
  );
}
