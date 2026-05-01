import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { UiProfile } from "./members";

export interface AppUser {
  id: string;
  email: string;
  member_key: string;
  display_name: string;
  age: number | null;
  ui_profile: UiProfile;
  level: number;
  xp: number;
  streak_days: number;
  avatar: string | null;
}

export async function requireUser(): Promise<AppUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data } = await supabase.from("users").select("*").eq("id", user.id).single();

  // Auth-пользователь есть, но profile-row нет — восстанавливаем из metadata,
  // чтобы не было redirect-loop /dashboard ↔ /register.
  if (!data) {
    const meta = (user.user_metadata ?? {}) as { member_key?: string; display_name?: string };
    const memberKey = meta.member_key || `user-${user.id.slice(0, 8)}`;
    const displayName = meta.display_name || user.email?.split("@")[0] || "User";
    const { data: created, error } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email ?? "",
        member_key: memberKey,
        display_name: displayName,
        ui_profile: "default",
      })
      .select()
      .single();
    if (error || !created) redirect("/register");
    data = created;
  }

  return data as AppUser;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
    return (data as AppUser) ?? null;
  } catch {
    return null;
  }
}
