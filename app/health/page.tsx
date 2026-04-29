import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CardLabel } from "@/components/ui/card";
import { HealthClient } from "./health-client";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("health_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>Здоровье</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">ТЕЛО</h1>
        <p className="text-muted text-sm mt-2">Питание, сон, тренировки, метрики, вода.</p>
      </header>
      <HealthClient initial={logs ?? []} />
    </AppShell>
  );
}
