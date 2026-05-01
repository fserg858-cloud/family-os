import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ShoppingClient } from "./shopping-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: items } = await supabase
    .from("shopping_list")
    .select("*")
    .order("created_at", { ascending: false });
  const locale = getServerLocale();

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("shopping.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("shopping.subtitle", locale)}</p>
      </header>
      <ShoppingClient initial={items ?? []} />
    </AppShell>
  );
}
