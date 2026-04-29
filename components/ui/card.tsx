import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface p-5", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("display text-2xl text-text mb-3 tracking-wide", className)}
      {...rest}
    />
  );
}

export function CardLabel({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-xs uppercase tracking-[0.2em] text-muted", className)}
      {...rest}
    />
  );
}
