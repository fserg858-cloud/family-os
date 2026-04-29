"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Repeat,
  HeartPulse,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Дом", icon: LayoutDashboard },
  { href: "/habits", label: "Привычки", icon: Repeat },
  { href: "/health", label: "Здоровье", icon: HeartPulse },
  { href: "/assistant", label: "AI", icon: Sparkles },
  { href: "/family", label: "Семья", icon: Users },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-bg border-t border-border z-40">
      <div className="grid grid-cols-5">
        {NAV.map((it) => {
          const active = path === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px]",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon size={20} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
