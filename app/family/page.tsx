import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CardLabel } from "@/components/ui/card";
import { FamilyClient } from "./family-client";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const user = await requireUser();
  const supabase = createClient();

  const [
    { data: events },
    { data: tasks },
    { data: shopping },
    { data: challenges },
    { data: progress },
    { data: members },
  ] = await Promise.all([
    supabase.from("family_events").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("family_tasks").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("shopping_list").select("*").order("created_at", { ascending: false }),
    supabase.from("family_challenges").select("*").eq("active", true),
    supabase.from("challenge_progress").select("*"),
    supabase
      .from("users")
      .select("id, display_name, member_key, level, xp")
      .order("xp", { ascending: false }),
  ]);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>Семья</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">КЛАН</h1>
        <p className="text-muted text-sm mt-2">Лента, задачи, продукты, челленджи, рейтинг.</p>
      </header>
      <FamilyClient
        currentUserId={user.id}
        events={events ?? []}
        tasks={tasks ?? []}
        shopping={shopping ?? []}
        challenges={challenges ?? []}
        progress={progress ?? []}
        members={members ?? []}
      />
    </AppShell>
  );
}
