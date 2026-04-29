import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, CLAUDE_MODEL, buildSystemPrompt } from "@/lib/claude";
import type { MemberKey } from "@/lib/members";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const { data: profile } = await sb.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "profile missing" }, { status: 400 });

  const { data: memory } = await sb
    .from("ai_memory")
    .select("key, value, importance")
    .eq("user_id", user.id)
    .order("importance", { ascending: false })
    .limit(15);

  const { data: history } = await sb
    .from("ai_conversations")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recent = (history ?? []).reverse();

  const system = buildSystemPrompt(
    profile.member_key as MemberKey,
    (memory ?? []).map((m: any) => `${m.key}: ${m.value}`),
  );

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system,
    messages: [
      ...recent
        .filter((h: any) => h.role === "user" || h.role === "assistant")
        .map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ],
  });

  const reply =
    response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim() || "(пустой ответ)";

  await sb.from("ai_conversations").insert([
    { user_id: user.id, role: "user", content: message },
    { user_id: user.id, role: "assistant", content: reply },
  ]);

  const lower = message.toLowerCase();
  const memHints: { key: string; value: string; importance: number }[] = [];
  if (lower.includes("люблю") || lower.includes("нравится")) {
    memHints.push({ key: `pref_${Date.now()}`, value: message.slice(0, 200), importance: 4 });
  }
  if (lower.includes("цель") || lower.includes("хочу")) {
    memHints.push({ key: `goal_${Date.now()}`, value: message.slice(0, 200), importance: 5 });
  }
  if (memHints.length) {
    await sb.from("ai_memory").upsert(
      memHints.map((m) => ({ user_id: user.id, ...m })),
      { onConflict: "user_id,key" },
    );
  }

  return NextResponse.json({ reply });
}
