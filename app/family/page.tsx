import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { FamilyClient } from "./family-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: { u?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: members }, { data: tasks }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, member_key, level, xp")
      .order("xp", { ascending: false }),
    supabase.from("family_tasks").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  const locale = getServerLocale();
  return (
    <AppShell user={user}>
      <header className="pt-2 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("family.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("family.subtitle", locale)}</p>
      </header>
      <FamilyClient
        members={members ?? []}
        tasks={tasks ?? []}
        currentUserId={user.id}
        initialFilter={searchParams.u ?? null}
      />
    </AppShell>
  );
}
