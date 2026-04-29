import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
}

export function Button({ className, variant = "primary", ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-accent text-bg hover:bg-accent/90",
    ghost: "bg-transparent text-text hover:bg-surface2",
    outline: "border border-border text-text hover:border-accent hover:text-accent",
  };
  return <button className={cn(base, styles[variant], className)} {...rest} />;
}
