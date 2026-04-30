"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences } from "./preferences-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, setTheme, t } = usePreferences();
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium">
          {t("settings.theme")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SegBtn active={theme === "dark"} onClick={() => setTheme("dark")}>
          <Moon size={16} />
          <span>{t("settings.theme.dark")}</span>
        </SegBtn>
        <SegBtn active={theme === "light"} onClick={() => setTheme("light")}>
          <Sun size={16} />
          <span>{t("settings.theme.light")}</span>
        </SegBtn>
      </div>
    </div>
  );
}

export function LocaleSwitch() {
  const { locale, setLocale, t } = usePreferences();
  const items: { v: Locale; label: string; flag: string }[] = [
    { v: "ru", label: t("settings.language.ru"), flag: "🇷🇺" },
    { v: "en", label: t("settings.language.en"), flag: "🇬🇧" },
  ];
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium">
          {t("settings.language")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <SegBtn key={it.v} active={locale === it.v} onClick={() => setLocale(it.v)}>
            <span>{it.flag}</span>
            <span>{it.label}</span>
          </SegBtn>
        ))}
      </div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors",
        active ? "bg-accent text-white" : "bg-surface2 text-text",
      )}
    >
      {children}
    </button>
  );
}
