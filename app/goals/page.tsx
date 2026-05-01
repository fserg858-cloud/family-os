import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { GoalsClient } from "./goals-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const locale = getServerLocale();

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("goals.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("goals.subtitle", locale)}</p>
      </header>
      <GoalsClient initial={goals ?? []} />
    </AppShell>
  );
}
