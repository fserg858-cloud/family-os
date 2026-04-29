import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface p-4", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold mb-2", className)} {...rest} />;
}

export function CardLabel({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-[11px] uppercase tracking-[0.16em] text-muted font-medium", className)}
      {...rest}
    />
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mt-6 mb-3">
      <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted font-medium">{title}</h2>
      {action}
    </div>
  );
}
