import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireUser();
  const sb = createClient();
  const now = new Date().toISOString();
  const { data } = await sb
    .from("family_calendar")
    .select("*")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(50);

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Календарь семьи</h1>
        <p className="text-xs text-muted mt-1">Совместные события + напоминания за 24ч и за 1ч в Telegram</p>
      </header>
      <CalendarClient initial={data ?? []} />
    </AppShell>
  );
}
