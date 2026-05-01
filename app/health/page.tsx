import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { HealthClient } from "./health-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

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
  const locale = getServerLocale();

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("health.title", locale)}</h1>
      </header>
      <HealthClient initial={logs ?? []} />
    </AppShell>
  );
}
