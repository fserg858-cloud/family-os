import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { EventsClient } from "./events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const [{ data: events }, { data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from("family_events")
      .select("id, actor_id, kind, payload, created_at")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("family_tasks")
      .select("*")
      .gte("due_at", start.toISOString())
      .order("due_at", { ascending: true }),
    supabase.from("users").select("id, display_name, member_key"),
  ]);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">События</h1>
        <p className="text-xs text-muted mt-1">Что происходит в семье на неделе</p>
      </header>
      <EventsClient
        events={events ?? []}
        tasks={tasks ?? []}
        members={members ?? []}
      />
    </AppShell>
  );
}
