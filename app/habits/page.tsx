import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CardLabel } from "@/components/ui/card";
import { HabitsClient } from "./habits-client";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const today = todayISO();
  const [{ data: habits }, { data: todayLogs }] = await Promise.all([
    supabase.from("habits").select("*").eq("active", true).order("created_at"),
    supabase.from("habit_logs").select("*").eq("done_on", today),
  ]);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <CardLabel>Привычки</CardLabel>
        <h1 className="display text-5xl text-accent tracking-[0.05em] mt-1">РИТМ</h1>
        <p className="text-muted text-sm mt-2 max-w-prose">
          Привычка — это пакет повторений, который миелинизирует нейронный путь.
          Через 21 день путь толще на 5–10%, через 66 — поведение становится дефолтом.
          Цель не «сила воли», а число повторений без срыва.
        </p>
      </header>

      <HabitsClient
        initial={habits ?? []}
        doneToday={(todayLogs ?? []).map((l: any) => l.habit_id)}
      />
    </AppShell>
  );
}
