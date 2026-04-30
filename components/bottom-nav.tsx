"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Calendar, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "./preferences-provider";
import type { TKey } from "@/lib/i18n";

export function BottomNav() {
  const path = usePathname() ?? "";
  const { t } = usePreferences();

  const NAV: { href: string; key: TKey; icon: any; match: string[] }[] = [
    { href: "/dashboard", key: "nav.home", icon: Home, match: ["/dashboard"] },
    { href: "/tasks", key: "nav.tasks", icon: ListTodo, match: ["/tasks"] },
    { href: "/events", key: "nav.events", icon: Calendar, match: ["/events"] },
    { href: "/profile", key: "nav.profile", icon: User, match: ["/profile"] },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="relative mx-auto max-w-md grid grid-cols-5 items-end h-[64px]">
        {NAV.slice(0, 2).map((it) => (
          <NavItem key={it.href} href={it.href} label={t(it.key)} Icon={it.icon} active={it.match.some((m) => path.startsWith(m))} />
        ))}

        <div className="flex items-center justify-center">
          <Link
            href="/tasks/create"
            className="-mt-7 w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-soft active:scale-95 transition-transform"
            aria-label={t("nav.add_task")}
          >
            <Plus className="text-white" size={26} />
          </Link>
        </div>

        {NAV.slice(2).map((it) => (
          <NavItem key={it.href} href={it.href} label={t(it.key)} Icon={it.icon} active={it.match.some((m) => path.startsWith(m))} />
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
