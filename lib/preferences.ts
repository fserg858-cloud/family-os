import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/lib/i18n";

export type Theme = "dark" | "light";

export function getServerTheme(): Theme {
  const v = cookies().get("theme")?.value;
  return v === "light" ? "light" : "dark";
}

export function getServerLocale(): Locale {
  const v = cookies().get("locale")?.value;
  return isLocale(v) ? v : "ru";
}
