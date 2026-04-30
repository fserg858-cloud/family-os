import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { MenuClient } from "./menu-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Меню недели</h1>
        <p className="text-xs text-muted mt-1">AI-нутрициолог составит план на 7 дней + список покупок</p>
      </header>
      <MenuClient />
    </AppShell>
  );
}
