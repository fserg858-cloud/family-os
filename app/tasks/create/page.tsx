import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CreateTaskClient } from "./create-task-client";

export const dynamic = "force-dynamic";

export default async function CreateTaskPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: members } = await supabase.from("users").select("id, display_name, member_key");

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Новая задача</h1>
      </header>
      <CreateTaskClient members={members ?? []} currentUserId={user.id} />
    </AppShell>
  );
}
