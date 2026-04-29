"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Repeat,
  HeartPulse,
  Sparkles,
  GraduationCap,
  Moon,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import { Progress } from "./ui/progress";
import { xpProgress } from "@/lib/xp";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  display_name: string;
  member_key: string;
  level: number;
  xp: number;
}

const NAV = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/habits", label: "Привычки", icon: Repeat },
  { href: "/health", label: "Здоровье", icon: HeartPulse },
  { href: "/assistant", label: "AI ассистент", icon: Sparkles },
  { href: "/growth", label: "Развитие", icon: GraduationCap },
  { href: "/reflection", label: "Рефлексия", icon: Moon },
  { href: "/family", label: "Семья", icon: Users },
  { href: "/report", label: "Отчёт недели", icon: FileText },
];

export function Sidebar({ display_name, member_key, level, xp }: Props) {
  const path = usePathname();
  const router = useRouter();
  const { into, max, percent } = xpProgress(xp);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-bg border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="display text-3xl text-accent tracking-[0.18em]">FAMILY OS</div>
        <div className="text-xs text-muted mt-1">v0.1 · {member_key}</div>
      </div>

      <div className="p-5 border-b border-border">
        <div className="text-sm text-text">{display_name}</div>
        <div className="text-xs text-muted mt-1">Уровень {level} · {xp} XP</div>
        <Progress value={percent} className="mt-3" />
        <div className="text-[10px] text-muted mt-1">
          {into} / {max} до следующего уровня
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = path === item.href || path?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                active
                  ? "bg-surface2 text-accent border border-accent/30"
                  : "text-text hover:bg-surface2",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-danger hover:bg-surface2 transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
