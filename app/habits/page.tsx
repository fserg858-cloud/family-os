import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { HabitsClient } from "./habits-client";
import { todayISO } from "@/lib/utils";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const today = todayISO();
  const [{ data: habits }, { data: todayLogs }] = await Promise.all([
    supabase.from("habits").select("*").eq("active", true).order("created_at"),
    supabase.from("habit_logs").select("*").eq("done_on", today),
  ]);
  const locale = getServerLocale();

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("habits.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("habits.subtitle", locale)}</p>
      </header>
      <HabitsClient
        initial={habits ?? []}
        doneToday={(todayLogs ?? []).map((l: any) => l.habit_id)}
      />
    </AppShell>
  );
}
