import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/lib/i18n";
import { isAccent, type AccentKey } from "@/lib/accents";

export type Theme = "dark" | "light";
export type { AccentKey };

export function getServerTheme(): Theme {
  const v = cookies().get("theme")?.value;
  return v === "light" ? "light" : "dark";
}

export function getServerLocale(): Locale {
  const v = cookies().get("locale")?.value;
  return isLocale(v) ? v : "ru";
}

export function getServerAccent(): AccentKey {
  const v = cookies().get("accent")?.value;
  return isAccent(v) ? v : "pink";
}
