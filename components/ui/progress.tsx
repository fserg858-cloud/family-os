import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  color = "#FF6B8A",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 rounded-full bg-surface2 overflow-hidden", className)}>
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
