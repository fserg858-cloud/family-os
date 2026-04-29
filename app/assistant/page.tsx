import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
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
      <header className="pt-2 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">AI ассистент</h1>
        <p className="text-xs text-muted mt-1">
          Факт → Механизм → Что значит → Шаг → 7/30/90
        </p>
      </header>
      <AssistantClient history={history ?? []} memberName={user.display_name} />
    </AppShell>
  );
}
