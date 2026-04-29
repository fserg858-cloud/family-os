import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase.from("family_tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("users").select("id, display_name, member_key"),
  ]);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Задачи</h1>
        <p className="text-xs text-muted mt-1">Свайп вправо — выполнить, влево — удалить</p>
      </header>
      <TasksClient initial={tasks ?? []} members={members ?? []} currentUserId={user.id} />
    </AppShell>
  );
}
