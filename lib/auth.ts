import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { MEMBERS, type MemberKey, type UiProfile } from "./members";

export interface AppUser {
  id: string;
  email: string;
  member_key: MemberKey;
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

  // Auth-пользователь есть, но нет profile-row — пробуем восстановить из metadata,
  // чтобы не было redirect-loop /dashboard ↔ /register.
  if (!data) {
    const meta = (user.user_metadata ?? {}) as { member_key?: string; display_name?: string };
    const key = (meta.member_key as MemberKey) || "fedor";
    const m = MEMBERS[key] ?? MEMBERS.fedor;
    const { data: created, error } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email ?? "",
        member_key: m.key,
        display_name: meta.display_name || m.display_name,
        age: m.age,
        ui_profile: m.ui_profile,
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
