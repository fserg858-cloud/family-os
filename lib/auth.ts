import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { MemberKey, UiProfile } from "./members";

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

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!data) redirect("/register");
  return data as AppUser;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return (data as AppUser) ?? null;
}
