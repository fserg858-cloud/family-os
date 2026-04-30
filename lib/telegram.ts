import { createHash, createHmac } from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Валидация подписи Telegram Login Widget по схеме из доки:
// https://core.telegram.org/widgets/login#checking-authorization
//
// data_check_string = поля кроме hash, отсортированные по ключам, формата "key=value\nkey=value"
// secret_key = SHA256(bot_token)
// computed_hash = HMAC_SHA256(data_check_string, secret_key)
// — если computed_hash === hash, подпись валидна.
export function validateTelegramAuth(
  data: Record<string, unknown>,
  botToken: string,
): boolean {
  const { hash, ...rest } = data as Record<string, unknown> & { hash?: string };
  if (!hash || typeof hash !== "string") return false;

  const dataCheckString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null && rest[k] !== "")
    .sort()
    .map((k) => `${k}=${String(rest[k])}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computed = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return computed === hash;
}

export function isAuthDateFresh(authDate: number, maxAgeSec = 86400): boolean {
  if (!Number.isFinite(authDate)) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - authDate < maxAgeSec;
}

// Детерминистический пароль на пары (telegram_id, secret).
// Серверный — клиент его не видит, нужен только чтобы провернуть signInWithPassword.
export function deriveTelegramPassword(tgId: string | number, botToken: string): string {
  return createHmac("sha256", botToken).update(`xs-family:tg:${tgId}`).digest("hex");
}

export function telegramEmail(tgId: string | number): string {
  return `tg_${tgId}@telegram.xs-family.local`;
}
