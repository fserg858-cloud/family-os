import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ChatClient } from "./chat-client";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = createClient();

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase
      .from("family_messages")
      .select("id, sender_id, body, attachment_url, attachment_type, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("users").select("id, display_name, member_key"),
  ]);

  const locale = getServerLocale();

  return (
    <AppShell user={user}>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("chat.title", locale)}</h1>
        <p className="text-xs text-muted mt-1">{t("chat.subtitle", locale)}</p>
      </header>
      <ChatClient
        initial={(messages ?? []).reverse()}
        members={members ?? []}
        currentUserId={user.id}
      />
    </AppShell>
  );
}
