import Link from "next/link";
import { Bell } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { MemberAvatar } from "./member-avatar";
import type { AppUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
  hideNav = false,
  topBar = true,
  unread = 0,
}: {
  user: AppUser;
  children: React.ReactNode;
  hideNav?: boolean;
  topBar?: boolean;
  unread?: number;
}) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        {topBar && (
          <header className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between bg-bg/90 backdrop-blur-md">
            <Link href="/profile" className="flex items-center gap-3">
              <MemberAvatar memberKey={user.member_key} size="sm" />
              <div className="leading-tight">
                <div className="text-[11px] text-muted">Привет</div>
                <div className="text-sm font-medium">{user.display_name}</div>
              </div>
            </Link>
            <Link
              href="/notifications"
              className="relative w-10 h-10 rounded-full bg-surface flex items-center justify-center"
              aria-label="Уведомления"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-[10px] flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </header>
        )}
        <main className="flex-1 px-5 pb-32">{children}</main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
