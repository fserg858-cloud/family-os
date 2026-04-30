"use client";

import { usePreferences } from "./preferences-provider";
import type { TKey } from "@/lib/i18n";

export function I18nText({ k }: { k: TKey }) {
  const { t } = usePreferences();
  return <>{t(k)}</>;
}
