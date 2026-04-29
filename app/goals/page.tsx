import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardLabel } from "@/components/ui/card";
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
      <header className="mb-8">
        <CardLabel>Цели</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">КОМПАС</h1>
        <p className="text-muted text-sm mt-2">
          Дневные / недельные / месячные / годовые. Без целей нет траектории.
        </p>
      </header>

      <GoalsClient initial={goals ?? []} />

      {!goals?.length && (
        <Card className="mt-6 text-center">
          <CardLabel>Пусто</CardLabel>
          <p className="text-muted mt-2">Добавь первую цель — недельную или дневную.</p>
        </Card>
      )}
    </AppShell>
  );
}
