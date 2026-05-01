import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { MenuClient } from "./menu-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const user = await requireUser();
  const locale = getServerLocale();
  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("menu.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("menu.subtitle", locale)}</p>
      </header>
      <MenuClient />
    </AppShell>
  );
}
