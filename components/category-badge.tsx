import { getCategory } from "@/lib/members";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: string | null | undefined; className?: string }) {
  const c = getCategory(category);
  return (
    <span
      className={cn("chip", className)}
      style={{ backgroundColor: c.color + "22", color: c.color }}
    >
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  );
}
