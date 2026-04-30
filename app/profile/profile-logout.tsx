"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/components/preferences-provider";

export function ProfileLogout() {
  const router = useRouter();
  const { t } = usePreferences();
  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-surface text-danger active:scale-[0.98] transition-transform"
    >
      <LogOut size={16} />
      {t("profile.logout")}
    </button>
  );
}
