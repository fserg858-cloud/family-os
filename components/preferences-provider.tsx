"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { t as translate, type Locale, type TKey } from "@/lib/i18n";

type Theme = "dark" | "light";

interface Ctx {
  theme: Theme;
  locale: Locale;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale) => void;
  t: (key: TKey) => string;
}

const PreferencesContext = createContext<Ctx | null>(null);

function setCookie(name: string, value: string) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function PreferencesProvider({
  initialTheme,
  initialLocale,
  children,
}: {
  initialTheme: Theme;
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setCookie("theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookie("locale", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", next);
    }
  }, []);

  const t = useCallback((key: TKey) => translate(key, locale), [locale]);

  return (
    <PreferencesContext.Provider value={{ theme, locale, setTheme, setLocale, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Ctx {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
