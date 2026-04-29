"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Calendar, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Главная", icon: Home, match: ["/dashboard"] },
  { href: "/tasks", label: "Задачи", icon: ListTodo, match: ["/tasks"] },
  { href: "/events", label: "События", icon: Calendar, match: ["/events"] },
  { href: "/profile", label: "Профиль", icon: User, match: ["/profile"] },
];

export function BottomNav() {
  const path = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="relative mx-auto max-w-md grid grid-cols-5 items-end h-[64px]">
        {NAV.slice(0, 2).map((it) => (
          <NavItem key={it.href} href={it.href} label={it.label} Icon={it.icon} active={it.match.some((m) => path.startsWith(m))} />
        ))}

        <div className="flex items-center justify-center">
          <Link
            href="/tasks/create"
            className="-mt-7 w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-soft active:scale-95 transition-transform"
            aria-label="Добавить задачу"
          >
            <Plus className="text-white" size={26} />
          </Link>
        </div>

        {NAV.slice(2).map((it) => (
          <NavItem key={it.href} href={it.href} label={it.label} Icon={it.icon} active={it.match.some((m) => path.startsWith(m))} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 h-full text-[11px]",
        active ? "text-accent" : "text-muted",
      )}
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}
