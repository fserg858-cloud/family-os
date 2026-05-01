import { createHmac } from "crypto";

// Детерминистический пароль на пары (telegram_id, secret).
// Серверный — клиент его не видит, нужен только чтобы провернуть signInWithPassword.
export function deriveTelegramPassword(tgId: string | number, botToken: string): string {
  return createHmac("sha256", botToken).update(`xs-family:tg:${tgId}`).digest("hex");
}

export function telegramEmail(tgId: string | number): string {
  return `tg_${tgId}@telegram.xs-family.local`;
}
