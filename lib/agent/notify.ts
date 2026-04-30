import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram-bot";

// Достаём всех залогиненных через TG членов семьи (по user_metadata.telegram_id)
async function getFamilyTelegramChats(): Promise<{ user_id: string; chat_id: string; display_name: string }[]> {
  const sb = createAdminClient();
  const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) return [];
  const out: { user_id: string; chat_id: string; display_name: string }[] = [];
  for (const u of list.data.users) {
    const tgId = (u.user_metadata as any)?.telegram_id;
    if (!tgId) continue;
    // Получим display_name из public.users
    const { data: profile } = await sb.from("users").select("display_name").eq("id", u.id).maybeSingle();
    out.push({
      user_id: u.id,
      chat_id: String(tgId),
      display_name: (profile as any)?.display_name ?? (u.user_metadata as any)?.first_name ?? "Участник",
    });
  }
  return out;
}

// Разослать всем членам семьи (кроме автора) уведомление
export async function notifyFamily(opts: {
  exceptUserId?: string;
  text: string;
}): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return;
  try {
    const chats = await getFamilyTelegramChats();
    await Promise.all(
      chats
        .filter((c) => c.user_id !== opts.exceptUserId)
        .map((c) => sendMessage(botToken, c.chat_id, opts.text)),
    );
  } catch {
    /* never throw */
  }
}

// Отправить ОДНОМУ члену семьи по auth user_id (если у него есть привязанный TG)
export async function notifyUser(userId: string, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return false;
  try {
    const sb = createAdminClient();
    const { data: u } = await sb.auth.admin.getUserById(userId);
    const tgId = (u?.user as any)?.user_metadata?.telegram_id;
    if (!tgId) return false;
    await sendMessage(botToken, String(tgId), text);
    return true;
  } catch {
    return false;
  }
}
