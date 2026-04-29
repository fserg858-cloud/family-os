import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { AssistantClient } from "./assistant-client";

export const dynamic = "force-dynamic";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default async function AssistantPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: latest } = await supabase
    .from("ai_conversations")
    .select("messages")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let history: Msg[] = [];
  if (latest && Array.isArray((latest as any).messages)) {
    history = ((latest as any).messages as any[])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content }));
  } else {
    const { data: rows } = await supabase
      .from("ai_conversations")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(40);
    history = ((rows ?? []) as any[])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({ role: r.role as "user" | "assistant", content: r.content as string }));
  }

  return (
    <AppShell user={user}>
      <AssistantClient initialHistory={history} memberName={user.display_name} />
    </AppShell>
  );
}
