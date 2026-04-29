import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import type { AppUser } from "@/lib/auth";

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        display_name={user.display_name}
        member_key={user.member_key}
        level={user.level}
        xp={user.xp}
      />
      <main className="flex-1 min-w-0 pb-24 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
