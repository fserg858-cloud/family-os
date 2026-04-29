import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-base", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input-base min-h-[96px] resize-y", className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("input-base appearance-none cursor-pointer", className)} {...rest} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] uppercase tracking-[0.16em] text-muted block mb-2 font-medium">{children}</span>;
}
