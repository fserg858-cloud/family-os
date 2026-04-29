import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}

const SIZE = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-[15px]",
  lg: "px-6 py-4 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  block,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-accent text-white",
    ghost: "bg-surface text-text",
    outline: "border border-border text-text hover:border-accent",
    danger: "bg-danger text-white",
  };
  return (
    <button
      className={cn(base, styles[variant], SIZE[size], block && "w-full", className)}
      {...rest}
    />
  );
}
