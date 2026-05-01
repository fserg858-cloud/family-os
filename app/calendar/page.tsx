import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CalendarClient } from "./calendar-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

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

  const locale = getServerLocale();
  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("calendar.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("calendar.subtitle", locale)}</p>
      </header>
      <CalendarClient initial={data ?? []} />
    </AppShell>
  );
}
