import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { FamilyClient } from "./family-client";

export const dynamic = "force-dynamic";

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: { u?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: members }, { data: tasks }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, member_key, level, xp")
      .order("xp", { ascending: false }),
    supabase.from("family_tasks").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Семья</h1>
        <p className="text-xs text-muted mt-1">Выбери участника, чтобы увидеть его задачи и прогресс</p>
      </header>
      <FamilyClient
        members={members ?? []}
        tasks={tasks ?? []}
        currentUserId={user.id}
        initialFilter={searchParams.u ?? null}
      />
    </AppShell>
  );
}
