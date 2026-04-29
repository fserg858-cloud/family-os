import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { GoalsClient } from "./goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Цели</h1>
        <p className="text-xs text-muted mt-1">Дневные / недельные / месячные / годовые</p>
      </header>
      <GoalsClient initial={goals ?? []} />
    </AppShell>
  );
}
