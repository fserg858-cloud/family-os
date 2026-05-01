"use client";

import { getCategory } from "@/lib/members";
import { cn } from "@/lib/utils";
import { usePreferences } from "./preferences-provider";
import { translateTaskCategory } from "@/lib/i18n";

export function CategoryBadge({ category, className }: { category: string | null | undefined; className?: string }) {
  const c = getCategory(category);
  const { locale } = usePreferences();
  return (
    <span
      className={cn("chip", className)}
      style={{ backgroundColor: c.color + "22", color: c.color }}
    >
      <span aria-hidden>{c.icon}</span>
      {translateTaskCategory(c.key, locale)}
    </span>
  );
}
